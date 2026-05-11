import SwiftUI

@main
struct iOSApp: App {
    let container = AppDependencyContainer()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.appContainer, container)
        }
    }
}
