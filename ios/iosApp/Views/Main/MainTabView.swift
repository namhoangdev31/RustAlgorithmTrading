import SwiftUI

struct MainTabView: View {
    @Environment(\.appContainer) private var container
    @State private var selection = 2

    var body: some View {
        TabView(selection: $selection) {
            HomeView()
                .tabItem { Label("Today", systemImage: "sparkles") }
                .tag(0)

            DiscoveryView()
                .tabItem { Label("Discovery", systemImage: "safari") }
                .tag(1)

            LibraryView()
                .tabItem { Label("Apps", systemImage: "square.stack.3d.up.fill") }
                .tag(2)

            ProfileView()
                .tabItem { Label("Profile", systemImage: "person.crop.circle.fill") }
                .tag(3)

            SearchView()
                .tabItem { Label("Search", systemImage: "magnifyingglass") }
                .tag(4)
        }
        .navigationTitle(currentTitle)
        .navigationBarHidden(true)
        .adaptiveTabBarMinimizeOnScroll()
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
