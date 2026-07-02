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
        
        return migrator
    }
}
