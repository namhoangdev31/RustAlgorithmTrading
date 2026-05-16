import SwiftUI
import AdaptiveSwiftUi

struct ProfileView: View {
    @EnvironmentObject var navigation: NavigationViewModel
    @State private var offsetY: CGFloat = 0

    var body: some View {
        AdaptiveScrollView {
            VStack(spacing: 16) {
                ProfileHeaderView(offsetY: offsetY) {
                    navigation.navigate(to: .settings)
                }
                VStack(spacing: 16) {
                    UserInfoView()
                    DashboardStatsView()

                    VStack(spacing: 16) {
                    AdaptiveButton(action: {
                        navigation.navigate(to: .updates)
                    }) {
                            HStack {
                                Image(systemName: "arrow.down.circle.fill")
                                    .font(.title2)
                                    .adaptiveForegroundStyle(.blue)
                                Text("Available Updates")
                                    .font(.body)
                                    .adaptiveForegroundStyle(.primary)
                                Spacer()
                                Text("4")
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .padding(6)
                                    .background(Color.red)
                                    .adaptiveForegroundStyle(.white)
                                    .clipShape(Circle())
                                Image(systemName: "chevron.right")
                                    .font(.caption)
                                    .adaptiveForegroundStyle(.secondary)
                            }
                            .padding()
                            .adaptiveGlass(cornerRadius: 12)
                        }
                        .adaptiveButtonStyle(.plain)

                        AdaptiveButton(action: {
                            navigation.navigate(to: .favorites)
                        }) {
                            FavoriteMiniAppsView()
                        }
                        .adaptiveButtonStyle(.plain)
                        SettingsGridView()
                    }
                    .padding(.vertical, 32)
                    .cornerRadius(32)
                    .padding(.horizontal)

                    Text("BUILD 2.4.1 PREMIUM STABLE")
                        .font(.caption2)
                        .fontWeight(.bold)
                        .adaptiveForegroundStyle(.secondary, opacity: 0.5)
                        .tracking(2)
                }
            }
            .padding(.bottom, 20)
            .onCompatScrollOffsetChange { offsetY = $0 }
        }
        .coordinateSpace(name: "scroll")
        .adaptiveBackgroundExtension()
        .navigationBarHidden(true)
    }
}
