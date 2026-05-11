import SwiftUI
// import Shared — replaced by native Swift Shared module

class MiniAppDetailsViewStateOld: ObservableObject {
    @Published var isDownloaded: Bool = false
    @Published var isLoading: Bool = false

    private let appId: String

    init(appId: String) {
        self.appId = appId
        checkInstallationStatus()
    }

    func checkInstallationStatus() {
        self.isDownloaded = AppInstallationService.shared.isAppInstalled(appId: appId)
    }

    func installApp(price: Double, navigation: NavigationViewModel) {
        if price > 0 {
            navigation.navigate(to: .checkout(appId: appId, price: price))
        } else {
            isLoading = true
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                AppInstallationService.shared.installApp(appId: self.appId)
                self.checkInstallationStatus()
                self.isLoading = false
            }
        }
    }

    func uninstallApp() {
        AppInstallationService.shared.uninstallApp(appId: appId)
        checkInstallationStatus()
    }

    func openApp() {
        print("Opening App: \(appId)")
        // In a real app, this would trigger the Mini App Runtime
    }
}
