import Foundation

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
