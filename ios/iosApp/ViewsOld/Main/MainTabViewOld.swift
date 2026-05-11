import SwiftUI

// iOS 16/17/18 compatible tab bar – mirrors AppCoordinator's 5 routes
// Design modeled after Apple's App Store native tab bar.
struct MainTabViewOld: View {
    @EnvironmentObject var navigation: NavigationViewModel

    var body: some View {
        TabView {
            HomeViewOld()
                .tabItem {
                    Label("Today", systemImage: "sparkles")
                }

            DiscoveryViewOld()
                .tabItem {
                    Label("Discovery", systemImage: "safari")
                }

            LibraryViewOld()
                .tabItem {
                    Label("Apps", systemImage: "square.stack.3d.up.fill")
                }

            ProfileViewOld()
                .tabItem {
                    Label("Profile", systemImage: "person.crop.circle.fill")
                }

            SearchViewOld()
                .tabItem {
                    Label("Search", systemImage: "magnifyingglass")
                }
        }
        .accentColor(.blue)
    }
}
