import Foundation
import SwiftData

@Model
final class MiniAppModel {
    @Attribute(.unique) var id: String
    var name: String
    var currentVersion: String
    var lastStableVersion: String?
    var status: String
    
    @Relationship(deleteRule: .cascade, inverse: \BundleHistoryModel.app)
    var bundleHistory: [BundleHistoryModel]
    
    @Relationship(deleteRule: .cascade, inverse: \PermissionModel.app)
    var permissions: [PermissionModel]
    
    init(id: String, name: String, currentVersion: String, lastStableVersion: String? = nil, status: String = "active") {
        self.id = id
        self.name = name
        self.currentVersion = currentVersion
        self.lastStableVersion = lastStableVersion
        self.status = status
        self.bundleHistory = []
        self.permissions = []
    }
}

@Model
final class BundleHistoryModel {
    var appId: String
    var version: String
    var path: String
    var sha256: String
    var status: String // active, inactive, failed, pending
    var installedAt: Date
    var launchAttempts: Int
    
    var app: MiniAppModel?
    
    init(appId: String, version: String, path: String, sha256: String, status: String = "active", installedAt: Date = Date(), launchAttempts: Int = 0) {
        self.appId = appId
        self.version = version
        self.path = path
        self.sha256 = sha256
        self.status = status
        self.installedAt = installedAt
        self.launchAttempts = launchAttempts
    }
}

@Model
final class PermissionModel {
    var appId: String
    var permission: String
    var granted: Bool
    
    var app: MiniAppModel?
    
    init(appId: String, permission: String, granted: Bool = false) {
        self.appId = appId
        self.permission = permission
        self.granted = granted
    }
}

@Model
final class RecentTabModel {
    @Attribute(.unique) var id: String
    var appId: String
    var version: String
    var lastUrl: String?
    var snapshotPath: String?
    var status: String
    var updatedAt: Date
    
    init(id: String, appId: String, version: String, lastUrl: String? = nil, snapshotPath: String? = nil, status: String, updatedAt: Date = Date()) {
        self.id = id
        self.appId = appId
        self.version = version
        self.lastUrl = lastUrl
        self.snapshotPath = snapshotPath
        self.status = status
        self.updatedAt = updatedAt
    }
}

@Model
final class RuntimeSessionModel {
    @Attribute(.unique) var sessionId: String
    var activeTabId: String?
    var updatedAt: Date
    
    init(sessionId: String = "default", activeTabId: String? = nil, updatedAt: Date = Date()) {
        self.sessionId = sessionId
        self.activeTabId = activeTabId
        self.updatedAt = updatedAt
    }
}

@Model
final class WebViewSnapshotModel {
    @Attribute(.unique) var tabId: String
    var appId: String
    var snapshotPath: String
    var sizeBytes: Int
    var updatedAt: Date
    
    init(tabId: String, appId: String, snapshotPath: String, sizeBytes: Int = 0, updatedAt: Date = Date()) {
        self.tabId = tabId
        self.appId = appId
        self.snapshotPath = snapshotPath
        self.sizeBytes = sizeBytes
        self.updatedAt = updatedAt
    }
}

@Model
final class LaunchAttemptModel {
    @Attribute(.unique) var id: String
    var appId: String
    var version: String
    var reason: String?
    var createdAt: Date
    
    init(id: String = UUID().uuidString, appId: String, version: String, reason: String? = nil, createdAt: Date = Date()) {
        self.id = id
        self.appId = appId
        self.version = version
        self.reason = reason
        self.createdAt = createdAt
    }
}

@Model
final class ResourceUsageModel {
    @Attribute(.unique) var id: String
    var appId: String
    var metric: String
    var value: Int
    var createdAt: Date
    
    init(id: String = UUID().uuidString, appId: String, metric: String, value: Int, createdAt: Date = Date()) {
        self.id = id
        self.appId = appId
        self.metric = metric
        self.value = value
        self.createdAt = createdAt
    }
}

@Model
final class BridgeAuditLogModel {
    @Attribute(.unique) var id: String
    var appId: String
    var action: String
    var permission: String?
    var success: Bool
    var errorCode: String?
    var errorMessage: String?
    var createdAt: Date
    
    init(id: String = UUID().uuidString, appId: String, action: String, permission: String? = nil, success: Bool, errorCode: String? = nil, errorMessage: String? = nil, createdAt: Date = Date()) {
        self.id = id
        self.appId = appId
        self.action = action
        self.permission = permission
        self.success = success
        self.errorCode = errorCode
        self.errorMessage = errorMessage
        self.createdAt = createdAt
    }
}

@Model
final class PendingUpdateModel {
    @Attribute(.unique) var id: String // "appId_version"
    var appId: String
    var version: String
    var status: String
    var errorMessage: String?
    var updatedAt: Date
    
    init(appId: String, version: String, status: String, errorMessage: String? = nil, updatedAt: Date = Date()) {
        self.id = "\(appId)_\(version)"
        self.appId = appId
        self.version = version
        self.status = status
        self.errorMessage = errorMessage
        self.updatedAt = updatedAt
    }
}
