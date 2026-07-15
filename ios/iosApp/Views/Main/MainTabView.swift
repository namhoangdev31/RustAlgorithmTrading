import ExploreSwiftUI
import SwiftUI

struct MainTabView: View {
    @Environment(\.appContainer) private var container
    @EnvironmentObject private var navigation: NavigationViewModel
    @AppStorage("isLoggedIn") private var isLoggedIn = false
    @State private var selection = 0
    @State private var lastPublicSelection = 0
    @State private var pendingProtectedSelection: Int?

    var body: some View {
        UniTabView(selection: guardedSelection) {
            UniTab("LeBrowser", systemImage: "safari", value: 0) {
                BrowserStartPageView(viewModel: container.makeBrowserViewModel(initialURL: nil, privateMode: false)) { route in
                    switch route {
                    case .search:
                        navigation.navigate(to: .browserSearch(isPrivate: false))
                    case .url(let url):
                        navigation.navigate(to: .browser(initialURL: url, privateMode: false))
                    case .tabSwitcher:
                        navigation.navigate(to: .browserTabSwitcher)
                    }
                }
            }

            UniTab("QuantAnt", systemImage: "sparkles", value: 1) {
                QuantAntView(store: container.makeQuantAntStore())
            }

            UniTab("My Apps", systemImage: "square.stack.3d.up.fill", value: 2) {
                LibraryView()
            }

            UniTab("Profile", systemImage: "person.crop.circle.fill", value: 3) {
                ProfileView()
            }

            UniTab("", systemImage: "magnifyingglass", value: 4, role: .search) {
                SearchView()
            }
        }
        .navigationTitle(currentTitle)
        .navigationBarHidden(true)
        .uniTabViewStyle(.automatic)
        .uniTabBarMinimizeBehavior(.onScrollDown)
        .onChange(of: isLoggedIn) { _, loggedIn in
            guard loggedIn, container.hasAccessToken(), let pendingProtectedSelection else { return }
            selection = pendingProtectedSelection
            self.pendingProtectedSelection = nil
        }
    }

    private var guardedSelection: Binding<Int> {
        Binding(
            get: { selection },
            set: { nextSelection in
                guard isProtectedTab(nextSelection) else {
                    selection = nextSelection
                    lastPublicSelection = nextSelection
                    return
                }

                guard isAuthenticated else {
                    pendingProtectedSelection = nextSelection
                    selection = lastPublicSelection
                    navigateToLoginIfNeeded()
                    return
                }

                selection = nextSelection
            }
        )
    }

    private var isAuthenticated: Bool {
        isLoggedIn && container.hasAccessToken()
    }

    private func isProtectedTab(_ value: Int) -> Bool {
        value == 1 || value == 3
    }

    private func navigateToLoginIfNeeded() {
        if navigation.path.last != .login {
            navigation.navigate(to: .login)
        }
    }

    private var currentTitle: String {
        switch selection {
        case 0: return "Today"
        case 1: return "QuantAnt"
        case 2: return "Library"
        case 3: return "Profile"
        case 4: return "Search"
        default: return ""
        }
    }
}
