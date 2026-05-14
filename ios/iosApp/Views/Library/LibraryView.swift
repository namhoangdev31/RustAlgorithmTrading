import SwiftUI

struct LibraryView: View {
    @EnvironmentObject var navigation: NavigationViewModel
    @State private var scrollPosition = ScrollPosition(y: 0)
    @State private var offsetY: CGFloat = 0
    @State private var isShowingSidebar = false

    var body: some View {
        ZStack {
            ScrollView {
                VStack(spacing: 16) {
                    LibraryHeaderView(offsetY: offsetY) {
                        withAnimation(.spring()) {
                            isShowingSidebar.toggle()
                        }
                    }

                    // Updates Entry Point
                    Button(action: {
                        navigation.navigate(to: .updates)
                    }) {
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Updates Available")
                                    .font(.headline)
                                    .foregroundColor(.primary)
                                Text("4 pending updates")
                                    .font(.caption)
                                    .foregroundColor(.red)
                            }
                            Spacer()
                            Image(systemName: "chevron.right")
                                .foregroundColor(.gray)
                        }
                        .padding()
                        .background(Color(.secondarySystemGroupedBackground))
                        .cornerRadius(12)
                        .padding(.horizontal)
                    }


                    Button(action: {
                        navigation.navigate(to: .wallet)
                    }) {
                        DigitalWalletCardView()
                    }
                    .buttonStyle(PlainButtonStyle())

                    Button(action: {
                        navigation.navigate(to: .detail(itemId: "recently_opened"))
                    }) {
                        RecentlyOpenedView()
                    }
                    .buttonStyle(PlainButtonStyle())

                    AllAppsView()

                    ProductivityView()

                    LifestyleView()

                    SystemView()

                    Color.clear.frame(height: 20)
                }
            }
            .scrollPosition($scrollPosition)
            .onScrollGeometryChange(for: CGFloat.self) { geometry in
                geometry.contentOffset.y
            } action: { oldValue, newValue in
                if oldValue != newValue {
                    offsetY = newValue
                }
            }
            .navigationBarHidden(true)

            SidebarView(isShowing: $isShowingSidebar)
                .zIndex(1)
        }
    }
}
