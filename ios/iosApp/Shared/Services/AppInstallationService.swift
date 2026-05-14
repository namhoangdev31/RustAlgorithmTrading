import Foundation

final class AppInstallationService {
    static let shared = AppInstallationService()

    private let installedAppsKey = "installed_apps"
    private let defaults = UserDefaults.standard

    private init() {}

    func isAppInstalled(appId: String) -> Bool {
        installedApps.contains(appId)
    }

    func installApp(appId: String) {
        var apps = installedApps
        apps.insert(appId)
        defaults.set(Array(apps), forKey: installedAppsKey)
    }

    func uninstallApp(appId: String) {
        var apps = installedApps
        apps.remove(appId)
        defaults.set(Array(apps), forKey: installedAppsKey)
    }

    private var installedApps: Set<String> {
        Set(defaults.stringArray(forKey: installedAppsKey) ?? [])
    }
}
