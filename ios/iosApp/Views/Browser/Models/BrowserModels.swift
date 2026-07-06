import Foundation
import SwiftUI
import Combine

public enum BrowserPageState: Equatable {
    case idle
    case loading(progress: Double)
    case loaded
    case failed(BrowserError)
    
    public static func == (lhs: BrowserPageState, rhs: BrowserPageState) -> Bool {
        switch (lhs, rhs) {
        case (.idle, .idle): return true
        case (.loaded, .loaded): return true
        case (.loading(let lp), .loading(let rp)): return lp == rp
        case (.failed(let le), .failed(let re)): return le.localizedDescription == re.localizedDescription
        default: return false
        }
    }
}

public enum BrowserError: Error, LocalizedError {
    case invalidURL
    case securityBlocked(reason: String)
    case navigationFailed(String)
    case webProcessCrashed
    case other(Error)
    
    public var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Địa chỉ URL không hợp lệ."
        case .securityBlocked(let reason):
            return "Trang web bị chặn vì lý do bảo mật: \(reason)"
        case .navigationFailed(let message):
            return "Lỗi tải trang: \(message)"
        case .webProcessCrashed:
            return "Trình duyệt bị sập bộ nhớ. Vui lòng tải lại trang."
        case .other(let error):
            return error.localizedDescription
        }
    }
}

public enum BrowserBlockedReason: String, Codable {
    case unsafeScheme = "Giao thức không an toàn"
    case privateModeFileAccess = "Không thể truy cập tệp tin cục bộ ở chế độ riêng tư"
    case dangerousHost = "Trang web có nguy cơ gây hại"
}

public enum BrowserNavigationDecision: Equatable {
    case allow
    case cancel
    case openExternal(URL)
    case openNewTab(URL)
    case blocked(reason: BrowserBlockedReason)
}

public struct BrowserHistoryItem: Codable, Identifiable, Hashable {
    public let id: UUID
    public let url: String
    public let title: String
    public let visitedAt: Date
    
    public init(id: UUID = UUID(), url: String, title: String, visitedAt: Date = Date()) {
        self.id = id
        self.url = url
        self.title = title
        self.visitedAt = visitedAt
    }
}

public struct BrowserBookmark: Codable, Identifiable, Hashable {
    public let id: UUID
    public let url: String
    public let title: String
    public let createdAt: Date
    
    public init(id: UUID = UUID(), url: String, title: String, createdAt: Date = Date()) {
        self.id = id
        self.url = url
        self.title = title
        self.createdAt = createdAt
    }
}

public struct BrowserReadingListItem: Codable, Identifiable, Hashable {
    public let id: UUID
    public let url: String
    public let title: String
    public let domain: String
    public let previewText: String
    public let createdAt: Date
    
    public init(id: UUID = UUID(), url: String, title: String, domain: String, previewText: String = "", createdAt: Date = Date()) {
        self.id = id
        self.url = url
        self.title = title
        self.domain = domain
        self.previewText = previewText
        self.createdAt = createdAt
    }
}

// MARK: - Navigation Route

public enum BrowserRoute: Hashable {
    case search                    // Open with empty search bar focused
    case url(String)               // Open and load a specific URL
}

// MARK: - Frequent Site (computed from history)

public struct FrequentSite: Identifiable, Hashable {
    public let id: String          // domain string
    public let domain: String
    public let title: String
    public let url: String
    public let visitCount: Int
    
    public init(domain: String, title: String, url: String, visitCount: Int) {
        self.id = domain
        self.domain = domain
        self.title = title
        self.url = url
        self.visitCount = visitCount
    }
}

// MARK: - Favicon Cache Service

public final class FaviconCache: ObservableObject {
    public static let shared = FaviconCache()
    
    private let fileManager = FileManager.default
    private let cacheDirectory: URL
    
    // In-memory cache of images
    @Published private var memoryCache: [String: UIImage] = [:]
    // Set of domains that we tried to load and failed (to avoid redundant network requests)
    private var failedDomains = Set<String>()
    // Set of domains currently downloading (to prevent concurrent duplicate downloads)
    private var downloadingDomains = Set<String>()
    
    private init() {
        let paths = fileManager.urls(for: .cachesDirectory, in: .userDomainMask)
        self.cacheDirectory = paths[0].appendingPathComponent("BrowserFavicons")
        
        // Create cache directory if it doesn't exist
        if !fileManager.fileExists(atPath: cacheDirectory.path) {
            try? fileManager.createDirectory(at: cacheDirectory, withIntermediateDirectories: true, attributes: nil)
        }
    }
    
    // Pure getter to be called inside SwiftUI body - no side effects!
    public func getCachedFavicon(for domain: String) -> UIImage? {
        return memoryCache[domain]
    }
    
    // Imperative trigger to be called inside onAppear/onChange - safe!
    public func loadFavicon(for domain: String) {
        guard !domain.isEmpty else { return }
        
        // 1. Check in-memory cache
        if memoryCache[domain] != nil {
            return
        }
        
        // 2. Avoid duplicate requests or retrying failed ones
        if failedDomains.contains(domain) || downloadingDomains.contains(domain) {
            return
        }
        
        // 3. Try reading from disk cache
        let fileURL = cacheDirectory.appendingPathComponent("\(domain).png")
        if fileManager.fileExists(atPath: fileURL.path) {
            if let data = try? Data(contentsOf: fileURL),
               let image = UIImage(data: data) {
                // Save to memory cache on MainActor to trigger observed updates
                DispatchQueue.main.async {
                    self.memoryCache[domain] = image
                }
                return
            }
        }
        
        // 4. Trigger download
        downloadingDomains.insert(domain)
        Task {
            await downloadFavicon(for: domain)
        }
    }
    
    private func downloadFavicon(for domain: String) async {
        guard !domain.isEmpty else { return }
        
        // Attempt list:
        // 1. Try Google's favicon redirect service first (highly likely to find high-resolution touch icons)
        // 2. Try directly downloading favicon.ico from the website root as fallback
        let urls = [
            URL(string: "https://www.google.com/s2/favicons?domain=\(domain)&sz=128"),
            URL(string: "https://\(domain)/favicon.ico")
        ].compactMap { $0 }
        
        for url in urls {
            var request = URLRequest(url: url)
            request.timeoutInterval = 4.0 // Short timeout to avoid blocking UI/network queue
            
            do {
                let (data, response) = try await URLSession.shared.data(for: request)
                guard let httpResponse = response as? HTTPURLResponse,
                      httpResponse.statusCode == 200,
                      let image = UIImage(data: data) else {
                    continue
                }
                
                // Confirm valid image sizes
                guard image.size.width > 1 && image.size.height > 1 else {
                    continue
                }
                
                // Save to disk cache
                let fileURL = cacheDirectory.appendingPathComponent("\(domain).png")
                try? data.write(to: fileURL)
                
                // Save to memory cache and publish updates
                _ = await MainActor.run {
                    self.memoryCache[domain] = image
                    self.downloadingDomains.remove(domain)
                }
                return
            } catch {
                continue
            }
        }
        
        // If all downloads fail, add to failed list to avoid re-requests in this session
        _ = await MainActor.run {
            self.failedDomains.insert(domain)
            self.downloadingDomains.remove(domain)
        }
    }
}

// MARK: - Reusable Favicon View Component

public struct FaviconView: View {
    let domain: String
    let size: CGFloat
    let initial: String
    let bgColor: Color?
    
    @ObservedObject private var cache = FaviconCache.shared
    
    public init(domain: String, size: CGFloat = 60, initial: String, bgColor: Color? = nil) {
        self.domain = domain.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        self.size = size
        self.initial = initial
        self.bgColor = bgColor
    }
    
    private var defaultBgColor: Color {
        if let bgColor = bgColor {
            return bgColor
        }
        let hash = abs(domain.hashValue)
        let hue = Double(hash % 360) / 360.0
        return Color(hue: hue, saturation: 0.55, brightness: 0.78)
    }
    
    public var body: some View {
        Group {
            if let image = cache.getCachedFavicon(for: domain) {
                if size >= 36 {
                    // Large tile style: center the icon inside a rounded tile background to avoid blurry scaling
                    ZStack {
                        RoundedRectangle(cornerRadius: size * 0.25, style: .continuous)
                            .fill(Color(UIColor.secondarySystemGroupedBackground))
                            .frame(width: size, height: size)
                            .shadow(color: .black.opacity(0.06), radius: 4, x: 0, y: 2)
                        
                        Image(uiImage: image)
                            .resizable()
                            .interpolation(.high)
                            .scaledToFit()
                            .frame(width: min(size * 0.55, 32), height: min(size * 0.55, 32))
                    }
                } else {
                    // Small inline style: render the image directly
                    Image(uiImage: image)
                        .resizable()
                        .interpolation(.high)
                        .scaledToFit()
                        .frame(width: size, height: size)
                        .clipShape(RoundedRectangle(cornerRadius: size * 0.25, style: .continuous))
                }
            } else {
                ZStack {
                    RoundedRectangle(cornerRadius: size * 0.25, style: .continuous)
                        .fill(defaultBgColor)
                        .frame(width: size, height: size)
                        
                    Text(initial.uppercased())
                        .font(.system(size: size * 0.4, weight: .bold))
                        .foregroundColor(.white)
                }
            }
        }
        .onAppear {
            cache.loadFavicon(for: domain)
        }
        .onChange(of: domain) { _, newDomain in
            cache.loadFavicon(for: newDomain)
        }
    }
}
