import Foundation
import SwiftData

@available(iOS 17.0, *)
final class DatabaseContainer {
    static let shared: ModelContainer = {
        do {
            let schema = Schema([
                MiniAppModel.self,
                BundleHistoryModel.self,
                PermissionModel.self,
                RecentTabModel.self,
                RuntimeSessionModel.self,
                WebViewSnapshotModel.self,
                LaunchAttemptModel.self,
                ResourceUsageModel.self,
                BridgeAuditLogModel.self,
                PendingUpdateModel.self
            ])
            let documentsURL = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            let dbURL = documentsURL.appendingPathComponent("miniapp_registry.store")
            let config = ModelConfiguration(url: dbURL, schema: schema)
            return try ModelContainer(for: schema, configurations: config)
        } catch {
            fatalError("Failed to initialize SwiftData ModelContainer: \(error.localizedDescription)")
        }
    }()
}

@available(iOS 17.0, *)
actor DatabaseService: ModelActor {
    nonisolated let modelContainer: ModelContainer
    nonisolated let modelExecutor: any ModelExecutor
    
    static let shared = DatabaseService(modelContainer: DatabaseContainer.shared)
    
    init(modelContainer: ModelContainer) {
        self.modelContainer = modelContainer
        let context = ModelContext(modelContainer)
        context.autosavesEnabled = false
        self.modelExecutor = DefaultModelExecutor(context: context)
    }
    
    private var context: ModelContext {
        modelExecutor.modelContext
    }
    
    private func save() {
        do {
            try context.save()
        } catch {
            print("[DatabaseService] Save failed: \(error.localizedDescription)")
        }
    }
    
    // MARK: - Permission APIs
    
    func getPermission(appId: String, permission: String) -> Bool? {
        let fetchDescriptor = FetchDescriptor<PermissionModel>(
            predicate: #Predicate { $0.appId == appId && $0.permission == permission }
        )
        do {
            let results = try context.fetch(fetchDescriptor)
            return results.first?.granted
        } catch {
            print("[DatabaseService] getPermission failed: \(error.localizedDescription)")
            return nil
        }
    }
    
    func savePermission(appId: String, permission: String, granted: Bool) {
        let fetchDescriptor = FetchDescriptor<PermissionModel>(
            predicate: #Predicate { $0.appId == appId && $0.permission == permission }
        )
        do {
            let results = try context.fetch(fetchDescriptor)
            if let existing = results.first {
                existing.granted = granted
            } else {
                let newPerm = PermissionModel(appId: appId, permission: permission, granted: granted)
                context.insert(newPerm)
            }
            save()
        } catch {
            print("[DatabaseService] savePermission failed: \(error.localizedDescription)")
        }
    }
    
    // MARK: - Install APIs
    
    func installOrUpdateApp(appId: String, name: String, version: String, path: String, sha256: String, isOTAUpdate: Bool) {
        do {
            let appFetch = FetchDescriptor<MiniAppModel>(predicate: #Predicate { $0.id == appId })
            let appResults = try context.fetch(appFetch)
            let app: MiniAppModel
            
            if let existingApp = appResults.first {
                app = existingApp
                app.name = name
                if !isOTAUpdate {
                    app.lastStableVersion = existingApp.currentVersion
                    app.currentVersion = version
                }
                app.status = "active"
            } else {
                app = MiniAppModel(id: appId, name: name, currentVersion: version, status: "active")
                context.insert(app)
            }
            
            let historyStatus = isOTAUpdate ? "pending" : "active"
            let newHistory = BundleHistoryModel(
                appId: appId,
                version: version,
                path: path,
                sha256: sha256,
                status: historyStatus,
                installedAt: Date(),
                launchAttempts: 0
            )
            context.insert(newHistory)
            
            newHistory.app = app
            if !app.bundleHistory.contains(where: { $0.version == version }) {
                app.bundleHistory.append(newHistory)
            }
            
            save()
        } catch {
            print("[DatabaseService] installOrUpdateApp failed: \(error.localizedDescription)")
        }
    }
    
    func cleanupOldVersions(versionsDirName: String) -> [String] {
        do {
            let fetchDescriptor = FetchDescriptor<BundleHistoryModel>(
                predicate: #Predicate { $0.status == "active" },
                sortBy: [SortDescriptor(\.installedAt, order: .reverse)]
            )
            let allActive = try context.fetch(fetchDescriptor)
            let matched = allActive.filter { $0.path.contains(versionsDirName) }
            let keep = Array(matched.prefix(3)).map { $0.version }
            return keep
        } catch {
            print("[DatabaseService] cleanupOldVersions failed: \(error.localizedDescription)")
            return []
        }
    }
    
    // MARK: - Launch & Rollback APIs
    
    func registerLaunch(appId: String, currentVersion: String) -> (activeVersion: String, attempts: Int) {
        var activeVersion = currentVersion
        
        do {
            let appFetch = FetchDescriptor<MiniAppModel>(predicate: #Predicate { $0.id == appId })
            let app = try context.fetch(appFetch).first
            
            let pendingFetch = FetchDescriptor<BundleHistoryModel>(
                predicate: #Predicate { $0.appId == appId && $0.status == "pending" }
            )
            if let pendingVersionHistory = try context.fetch(pendingFetch).first {
                let pendingVersion = pendingVersionHistory.version
                print("[DatabaseService] Found pending OTA update for \(appId): version \(pendingVersion). Swapping current version pointer.")
                
                let activeFetch = FetchDescriptor<BundleHistoryModel>(
                    predicate: #Predicate { $0.appId == appId && $0.status == "active" }
                )
                let activeHistories = try context.fetch(activeFetch)
                for h in activeHistories {
                    h.status = "inactive"
                }
                
                pendingVersionHistory.status = "active"
                
                if let app {
                    app.lastStableVersion = currentVersion
                    app.currentVersion = pendingVersion
                }
                
                activeVersion = pendingVersion
            }
            
            let currentHistoryFetch = FetchDescriptor<BundleHistoryModel>(
                predicate: #Predicate { $0.appId == appId && $0.version == activeVersion }
            )
            let currentHistory = try context.fetch(currentHistoryFetch).first
            if let currentHistory {
                currentHistory.launchAttempts += 1
            }
            
            save()
            
            let attempts = currentHistory?.launchAttempts ?? 0
            return (activeVersion, attempts)
        } catch {
            print("[DatabaseService] registerLaunch failed: \(error.localizedDescription)")
            return (activeVersion, 0)
        }
    }
    
    func markStable(appId: String, version: String) {
        do {
            let historyFetch = FetchDescriptor<BundleHistoryModel>(
                predicate: #Predicate { $0.appId == appId && $0.version == version }
            )
            if let history = try context.fetch(historyFetch).first {
                history.launchAttempts = 0
            }
            
            let appFetch = FetchDescriptor<MiniAppModel>(predicate: #Predicate { $0.id == appId })
            if let app = try context.fetch(appFetch).first {
                app.lastStableVersion = version
            }
            
            save()
        } catch {
            print("[DatabaseService] markStable failed: \(error.localizedDescription)")
        }
    }
    
    func getStableVersionForRollback(appId: String, failedVersion: String) -> String? {
        do {
            let appFetch = FetchDescriptor<MiniAppModel>(predicate: #Predicate { $0.id == appId })
            if let app = try context.fetch(appFetch).first, let stable = app.lastStableVersion {
                return stable
            }
            
            let historyFetch = FetchDescriptor<BundleHistoryModel>(
                predicate: #Predicate { $0.appId == appId && $0.version != failedVersion && $0.status == "active" },
                sortBy: [SortDescriptor(\.installedAt, order: .reverse)]
            )
            let results = try context.fetch(historyFetch)
            return results.first?.version
        } catch {
            print("[DatabaseService] getStableVersionForRollback failed: \(error.localizedDescription)")
            return nil
        }
    }
    
    func rollbackVersion(appId: String, failedVersion: String, restoreVersion: String) {
        do {
            let appFetch = FetchDescriptor<MiniAppModel>(predicate: #Predicate { $0.id == appId })
            if let app = try context.fetch(appFetch).first {
                app.currentVersion = restoreVersion
                app.status = "active"
            }
            
            let historyFetch = FetchDescriptor<BundleHistoryModel>(
                predicate: #Predicate { $0.appId == appId && $0.version == failedVersion }
            )
            if let history = try context.fetch(historyFetch).first {
                history.status = "failed"
            }
            
            save()
        } catch {
            print("[DatabaseService] rollbackVersion failed: \(error.localizedDescription)")
        }
    }
    
    // MARK: - Audit Log APIs
    
    func logBridgeCall(appId: String, action: String, permission: String?, success: Bool, errorCode: String?, errorMessage: String?) {
        let log = BridgeAuditLogModel(
            appId: appId,
            action: action,
            permission: permission,
            success: success,
            errorCode: errorCode,
            errorMessage: errorMessage,
            createdAt: Date()
        )
        context.insert(log)
        save()
    }
    
    // MARK: - State Store APIs
    
    struct TabPersistData {
        let id: String
        let appId: String
        let version: String
        let lastUrl: String?
        let snapshotPath: String?
        let status: String
    }
    
    func persistTabs(tabs: [TabPersistData], activeTabId: String?) {
        do {
            try context.delete(model: RecentTabModel.self)
            
            let now = Date()
            for tab in tabs {
                let tabModel = RecentTabModel(
                    id: tab.id,
                    appId: tab.appId,
                    version: tab.version,
                    lastUrl: tab.lastUrl,
                    snapshotPath: tab.snapshotPath,
                    status: tab.status,
                    updatedAt: now
                )
                context.insert(tabModel)
            }
            
            let sessionFetch = FetchDescriptor<RuntimeSessionModel>()
            let sessions = try context.fetch(sessionFetch)
            if let existing = sessions.first {
                existing.activeTabId = activeTabId
                existing.updatedAt = now
            } else {
                let newSession = RuntimeSessionModel(sessionId: "default", activeTabId: activeTabId, updatedAt: now)
                context.insert(newSession)
            }
            
            save()
        } catch {
            print("[DatabaseService] persistTabs failed: \(error.localizedDescription)")
        }
    }
    
    func recordPendingUpdate(appId: String, version: String, status: String, error: String?) {
        let compositeId = "\(appId)_\(version)"
        let fetchDescriptor = FetchDescriptor<PendingUpdateModel>(
            predicate: #Predicate { $0.id == compositeId }
        )
        do {
            let results = try context.fetch(fetchDescriptor)
            if let existing = results.first {
                existing.status = status
                existing.errorMessage = error
                existing.updatedAt = Date()
            } else {
                let newUpdate = PendingUpdateModel(
                    appId: appId,
                    version: version,
                    status: status,
                    errorMessage: error,
                    updatedAt: Date()
                )
                context.insert(newUpdate)
            }
            save()
        } catch {
            print("[DatabaseService] recordPendingUpdate failed: \(error.localizedDescription)")
        }
    }
}
