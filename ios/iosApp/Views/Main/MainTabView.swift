import AdaptiveSwiftUi
import SwiftUI

struct MainTabView: View {
    @Environment(\.appContainer) private var container
    @State private var selection = 2

    var body: some View {
        AdaptiveTabView(selection: $selection) {
            AdaptiveTab("Today", systemImage: "sparkles", value: 0) {
                HomeView()
            }

            AdaptiveTab("Discovery", systemImage: "safari", value: 1) {
                DiscoveryView()
            }

            AdaptiveTab("Apps", systemImage: "square.stack.3d.up.fill", value: 2) {
                LibraryView()
            }

            AdaptiveTab("Profile", systemImage: "person.crop.circle.fill", value: 3) {
                ProfileView()
            }

            AdaptiveTab("Search", systemImage: "magnifyingglass", value: 4, role: .search) {
                SearchView()
            }
        }
        .navigationTitle(currentTitle)
        .navigationBarHidden(true)
        .adaptiveTabViewStyle(.automatic)
        .adaptiveTabBarMinimizeBehavior(.onScrollDown)
    }

    private var currentTitle: String {
        switch selection {
        case 0: return "Today"
        case 1: return "Discovery"
        case 2: return "Library"
        case 3: return "Profile"
        case 4: return "Search"
        default: return ""
        }
    }
}
