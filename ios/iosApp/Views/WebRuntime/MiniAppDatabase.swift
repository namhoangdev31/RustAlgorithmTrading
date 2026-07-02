import Foundation
import GRDB

/// Central SQLite Database registry wrapper utilizing GRDB for metadata and runtime state management
final class MiniAppDatabase {
    static let shared: DatabaseQueue = {
        do {
            let fileManager = FileManager.default
            let documentsURL = fileManager.urls(for: .documentDirectory, in: .userDomainMask)[0]
            let dbURL = documentsURL.appendingPathComponent("miniapp_registry.sqlite")
            
            let dbQueue = try DatabaseQueue(path: dbURL.path)
            try migrator.migrate(dbQueue)
            return dbQueue
        } catch {
            fatalError("Failed to initialize SQLite Database: \(error.localizedDescription)")
        }
    }()
    
    private static var migrator: DatabaseMigrator {
        var migrator = DatabaseMigrator()
        
        migrator.registerMigration("createTables") { db in
            // 1. mini_apps table
            try db.create(table: "mini_apps") { t in
                t.column("id", .text).primaryKey()
                t.column("name", .text).notNull()
                t.column("current_version", .text).notNull()
                t.column("last_stable_version", .text)
                t.column("status", .text).notNull()
            }
            
            // 2. bundle_history table
            try db.create(table: "bundle_history") { t in
                t.autoIncrementedPrimaryKey("id")
                t.column("app_id", .text).notNull().references("mini_apps", column: "id", onDelete: .cascade)
                t.column("version", .text).notNull()
                t.column("path", .text).notNull()
                t.column("sha256", .text).notNull()
                t.column("status", .text).notNull() // active, inactive, failed
                t.column("installed_at", .datetime).defaults(to: Date())
                t.column("launch_attempts", .integer).notNull().defaults(to: 0)
            }
            
            // 3. permissions table
            try db.create(table: "permissions") { t in
                t.column("app_id", .text).notNull().references("mini_apps", column: "id", onDelete: .cascade)
                t.column("permission", .text).notNull()
                t.primaryKey(["app_id", "permission"])
                t.column("granted", .boolean).notNull().defaults(to: false)
            }
            
            // 4. recent_tabs table
            try db.create(table: "recent_tabs") { t in
                t.column("id", .text).primaryKey()
                t.column("app_id", .text).notNull()
                t.column("version", .text).notNull()
                t.column("last_url", .text)
                t.column("snapshot_path", .text)
                t.column("status", .text).notNull()
                t.column("updated_at", .datetime).defaults(to: Date())
            }
        }

        migrator.registerMigration("phase4RuntimeState") { db in
            try db.create(table: "runtime_sessions", ifNotExists: true) { t in
                t.column("session_id", .text).primaryKey()
                t.column("active_tab_id", .text)
                t.column("updated_at", .datetime).notNull().defaults(to: Date())
            }

            try db.create(table: "webview_snapshots", ifNotExists: true) { t in
                t.column("tab_id", .text).primaryKey()
                t.column("app_id", .text).notNull()
                t.column("snapshot_path", .text).notNull()
                t.column("size_bytes", .integer).notNull().defaults(to: 0)
                t.column("updated_at", .datetime).notNull().defaults(to: Date())
            }

            try db.create(table: "launch_attempts", ifNotExists: true) { t in
                t.autoIncrementedPrimaryKey("id")
                t.column("app_id", .text).notNull()
                t.column("version", .text).notNull()
                t.column("reason", .text)
                t.column("created_at", .datetime).notNull().defaults(to: Date())
            }

            try db.create(table: "resource_usage", ifNotExists: true) { t in
                t.autoIncrementedPrimaryKey("id")
                t.column("app_id", .text).notNull()
                t.column("metric", .text).notNull()
                t.column("value", .integer).notNull()
                t.column("created_at", .datetime).notNull().defaults(to: Date())
            }

            try db.create(table: "bridge_audit_logs", ifNotExists: true) { t in
                t.autoIncrementedPrimaryKey("id")
                t.column("app_id", .text).notNull()
                t.column("action", .text).notNull()
                t.column("permission", .text)
                t.column("success", .boolean).notNull()
                t.column("error_code", .text)
                t.column("error_message", .text)
                t.column("created_at", .datetime).notNull().defaults(to: Date())
            }

            try db.create(table: "pending_updates", ifNotExists: true) { t in
                t.column("app_id", .text).notNull()
                t.column("version", .text).notNull()
                t.column("status", .text).notNull()
                t.column("error_message", .text)
                t.column("updated_at", .datetime).notNull().defaults(to: Date())
                t.primaryKey(["app_id", "version"])
            }
        }
        
        return migrator
    }
}
