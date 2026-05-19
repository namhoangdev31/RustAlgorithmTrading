import ExploreSwiftUI
import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var navigation: NavigationViewModel
    @State private var offsetY: CGFloat = 0

    var body: some View {
        UniScrollView {
            VStack(spacing: 16) {
                ProfileHeaderView(offsetY: offsetY) {
                    navigation.navigate(to: .settings)
                }
                VStack(spacing: 16) {
                    UserInfoView()
                    DashboardStatsView()

                    VStack(spacing: 16) {
                        UniButton(action: {
                            navigation.navigate(to: .updates)
                        }) {
                            HStack {
                                Image(systemName: "arrow.down.circle.fill")
                                    .font(.title2)
                                    .uniForegroundStyle(.blue)
                                Text("Available Updates")
                                    .font(.body)
                                    .uniForegroundStyle(.primary)
                                Spacer()
                                Text("4")
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .padding(6)
                                    .background(Color.red)
                                    .uniForegroundStyle(.white)
                                    .clipShape(Circle())
                                Image(systemName: "chevron.right")
                                    .font(.caption)
                                    .uniForegroundStyle(.secondary)
                            }
                            .padding()
                            .uniGlass(cornerRadius: 12)
                        }
                        .uniButtonStyle(.plain)

                        UniButton(action: {
                            navigation.navigate(to: .favorites)
                        }) {
                            FavoriteMiniAppsView()
                        }
                        .uniButtonStyle(.plain)
                        SettingsGridView()
                    }
                    .padding(.vertical, 32)
                    .cornerRadius(32)
                    .padding(.horizontal)

                    Text("BUILD 2.4.1 PREMIUM STABLE")
                        .font(.caption2)
                        .fontWeight(.bold)
                        .uniForegroundStyle(.secondary, opacity: 0.5)
                        .uniTracking(2)
                }
            }
            .padding(.bottom, 20)
            .onCompatScrollOffsetChange { offsetY = $0 }
        }
        .coordinateSpace(name: "scroll")
        .uniBackgroundExtension()
        .navigationBarHidden(true)
    }
}
