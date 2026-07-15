import FirebaseCore
import GoogleSignIn
import SwiftUI

@main
struct iOSApp: App {
    let container: AppDependencyContainer

    init() {
        FirebaseApp.configure()
        self.container = AppDependencyContainer()
    }
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.appContainer, container)
                .onOpenURL { url in
                    GIDSignIn.sharedInstance.handle(url)
                }
        }
    }
}
