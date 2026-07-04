import ExploreSwiftUI
import SwiftUI

struct MainTabView: View {
    @Environment(\.appContainer) private var container
    @EnvironmentObject private var navigation: NavigationViewModel
    @State private var selection = 0

    var body: some View {
        UniTabView(selection: $selection) {
            UniTab("LepoStar", systemImage: "sparkles", value: 0) {
                BrowserStartPageView(viewModel: container.makeBrowserViewModel(initialURL: nil, privateMode: false)) { route in
                    switch route {
                    case .search:
                        navigation.navigate(to: .browser(initialURL: nil, privateMode: false))
                    case .url(let url):
                        navigation.navigate(to: .browser(initialURL: url, privateMode: false))
                    }
                }
            }

            UniTab("Discovery", systemImage: "safari", value: 1) {
                DiscoveryView()
            }

            UniTab("Apps", systemImage: "square.stack.3d.up.fill", value: 2) {
                LibraryView()
            }

            UniTab("Profile", systemImage: "person.crop.circle.fill", value: 3) {
                ProfileView()
            }

            UniTab("Search", systemImage: "magnifyingglass", value: 4, role: .search) {
                SearchView()
            }
        }
        .navigationTitle(currentTitle)
        .uniTabViewStyle(.automatic)
        .uniTabBarMinimizeBehavior(.onScrollDown)
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
