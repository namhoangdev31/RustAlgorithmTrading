import SwiftUI
// import Shared — replaced by native Swift Shared module

struct MainTabView: View {
    @Environment(\.appContainer) private var container
    @State private var selection = 2
    
    var body: some View {
        TabView(selection: $selection) {
            Tab("Today", systemImage: "sparkles", value: 0) {
                HomeView()
            }
            
            Tab("Discovery", systemImage: "safari", value: 1) {
                DiscoveryView()
            }
            
            Tab("Apps", systemImage: "square.stack.3d.up.fill", value: 2) {
                LibraryView()
            }
            
            Tab("Profile", systemImage: "person.crop.circle.fill", value: 3) {
                ProfileView()
            }
                
            Tab(value: 4, role: .search){
                SearchView()
            }
        }
        .navigationTitle(currentTitle)
        .toolbar(.hidden, for: .navigationBar)
        .adaptiveTabBarMinimizeOnScroll()
    }
    
    private var currentTitle: String {
        switch selection {
        case 0: return "Today"
        case 1: return "Discovery"
        case 2: return "Library"
        case 3: return "Profile"
        default: return ""
        }
    }
}
