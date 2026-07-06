import Combine
import Foundation
import SwiftUI
import UIKit

public enum BrowserPageState: Equatable {
    case idle
    case loading(progress: Double)
    case loaded
    case failed(BrowserError)
}

public enum BrowserError: Error, LocalizedError, Equatable {
    case invalidURL
    case securityBlocked(reason: String)
    case navigationFailed(String)
    case webProcessCrashed
    case other(String)

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
        case .other(let message):
            return message
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

    public init(
        id: UUID = UUID(),
        url: String,
        title: String,
        domain: String,
        previewText: String = "",
        createdAt: Date = Date()
    ) {
        self.id = id
        self.url = url
        self.title = title
        self.domain = domain
        self.previewText = previewText
        self.createdAt = createdAt
    }
}

public enum BrowserRoute: Hashable {
    case search
    case url(String)
}

public struct FrequentSite: Identifiable, Hashable {
    public let id: String
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

public final class FaviconCache: ObservableObject {
    public static let shared = FaviconCache()

    @Published private var memoryCache: [String: UIImage] = [:]

    private let fileManager: FileManager
    private let cacheDirectory: URL
    private let session: URLSession
    private let stateQueue = DispatchQueue(label: "com.lepos.browser.favicon-cache", qos: .utility)
    private var failedDomains = Set<String>()
    private var inFlightDomains = Set<String>()

    internal init(
        cacheDirectory: URL? = nil,
        session: URLSession = .shared,
        fileManager: FileManager = .default
    ) {
        self.fileManager = fileManager
        self.session = session
        self.cacheDirectory = cacheDirectory ?? fileManager
            .urls(for: .cachesDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("BrowserFavicons", isDirectory: true)
        try? fileManager.createDirectory(at: self.cacheDirectory, withIntermediateDirectories: true)
    }

    public func getCachedFavicon(for domain: String) -> UIImage? {
        memoryCache[normalizedDomain(domain)]
    }

    public func loadFavicon(for domain: String) {
        let domain = normalizedDomain(domain)
        guard !domain.isEmpty, memoryCache[domain] == nil else { return }

        if let image = UIImage(contentsOfFile: fileURL(for: domain).path) {
            DispatchQueue.main.async { [weak self] in
                self?.memoryCache[domain] = image
            }
            return
        }

        stateQueue.async { [weak self] in
            guard let self,
                  !self.failedDomains.contains(domain),
                  !self.inFlightDomains.contains(domain) else {
                return
            }
            self.inFlightDomains.insert(domain)
            Task { await self.downloadFavicon(for: domain) }
        }
    }

    private func downloadFavicon(for domain: String) async {
        for url in faviconCandidates(for: domain) {
            var request = URLRequest(url: url)
            request.timeoutInterval = 4

            do {
                let (data, response) = try await session.data(for: request)
                guard let httpResponse = response as? HTTPURLResponse,
                      httpResponse.statusCode == 200,
                      let image = UIImage(data: data),
                      image.size.width > 1,
                      image.size.height > 1 else {
                    continue
                }

                try? data.write(to: fileURL(for: domain), options: .atomic)
                await MainActor.run {
                    self.memoryCache[domain] = image
                }
                markDownloadFinished(for: domain, failed: false)
                return
            } catch {
                continue
            }
        }

        markDownloadFinished(for: domain, failed: true)
    }

    private func markDownloadFinished(for domain: String, failed: Bool) {
        stateQueue.async { [weak self] in
            self?.inFlightDomains.remove(domain)
            if failed {
                self?.failedDomains.insert(domain)
            }
        }
    }

    private func faviconCandidates(for domain: String) -> [URL] {
        [
            URL(string: "https://www.google.com/s2/favicons?domain=\(domain)&sz=128"),
            URL(string: "https://\(domain)/favicon.ico")
        ].compactMap { $0 }
    }

    private func fileURL(for domain: String) -> URL {
        cacheDirectory.appendingPathComponent("\(safeFileName(for: domain)).png", isDirectory: false)
    }

    private func normalizedDomain(_ domain: String) -> String {
        domain.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    }

    private func safeFileName(for domain: String) -> String {
        domain.map { character in
            character.isLetter || character.isNumber || character == "." || character == "-" ? character : "_"
        }.reduce(into: "") { $0.append($1) }
    }
}

public struct FaviconView: View {
    let domain: String
    let size: CGFloat
    let initial: String
    let bgColor: Color?

    @ObservedObject private var cache = FaviconCache.shared

    public init(domain: String, size: CGFloat = 60, initial: String, bgColor: Color? = nil) {
        self.domain = domain.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        self.size = size
        self.initial = initial
        self.bgColor = bgColor
    }

    public var body: some View {
        Group {
            if let image = cache.getCachedFavicon(for: domain) {
                Image(uiImage: image)
                    .resizable()
                    .interpolation(.high)
                    .scaledToFit()
                    .frame(width: iconSize, height: iconSize)
                    .frame(width: size, height: size)
                    .background(tileBackground)
                    .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
            } else {
                Text(displayInitial)
                    .font(.system(size: max(10, size * 0.38), weight: .bold))
                    .foregroundStyle(.white)
                    .frame(width: size, height: size)
                    .background(defaultBackground)
                    .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
            }
        }
        .onAppear { cache.loadFavicon(for: domain) }
        .onChange(of: domain) { _, newDomain in
            cache.loadFavicon(for: newDomain)
        }
    }

    private var iconSize: CGFloat {
        size >= 36 ? min(size * 0.55, 32) : size
    }

    private var cornerRadius: CGFloat {
        max(4, size * 0.24)
    }

    private var displayInitial: String {
        let fallback = domain.first.map(String.init) ?? "?"
        return (initial.first.map(String.init) ?? fallback).uppercased()
    }

    private var tileBackground: some View {
        RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
            .fill(Color(UIColor.secondarySystemGroupedBackground))
    }

    private var defaultBackground: some View {
        let hue = Double(abs(domain.hashValue % 360)) / 360
        return RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
            .fill(bgColor ?? Color(hue: hue, saturation: 0.52, brightness: 0.72))
    }
}
