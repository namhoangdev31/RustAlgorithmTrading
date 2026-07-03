import ExploreSwiftUI
import SwiftUI

struct LibraryView: View {
    @EnvironmentObject var navigation: NavigationViewModel
    @State private var offsetY: CGFloat = 0
    @State private var isShowingSidebar = false

    var body: some View {
        ZStack {
            UniScrollView {
                VStack(spacing: 16) {
                    LibraryHeaderView(offsetY: offsetY) {
                        withAnimation(.spring()) {
                            isShowingSidebar.toggle()
                        }
                    }

                    UniButton(action: {
                        navigation.navigate(to: .updates)
                    }) {
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Updates Available")
                                    .font(.headline)
                                    .uniForegroundStyle(.primary)
                                Text("4 pending updates")
                                    .font(.caption)
                                    .uniForegroundStyle(.red)
                            }
                            Spacer()
                            Image(systemName: "chevron.right")
                                .uniForegroundStyle(.gray)
                        }
                        .padding()
                        .uniGlass(cornerRadius: 12)
                        .padding(.horizontal)
                    }
                    .uniButtonStyle(.plain)

                    UniButton(action: {
                        navigation.navigate(to: .wallet)
                    }) {
                        DigitalWalletCardView()
                    }
                    .uniButtonStyle(.plain)

                    UniButton(action: {
                        navigation.navigate(to: .detail(itemId: "recently_opened"))
                    }) {
                        RecentlyOpenedView()
                    }
                    .uniButtonStyle(.plain)

                    AllAppsView()
                    ProductivityView()
                    LifestyleView()
                    SystemView()

                    Color.clear.frame(height: 20)
                }
                .onCompatScrollOffsetChange { offsetY = $0 }
            }
            .coordinateSpace(name: "scroll")
            .uniBackgroundExtension()
            .navigationBarHidden(true)

            SidebarView(isShowing: $isShowingSidebar)
                .zIndex(1)
        }
    }
}
