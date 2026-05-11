import SwiftUI

// iOS 16/17/18 – ProfileView compatible version
struct ProfileViewOld: View {
    @EnvironmentObject var navigation: NavigationViewModel
    @State private var offsetY: CGFloat = 0
    @State private var scrollPosition = ScrollPosition(y: 0)
    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                ProfileHeaderView(offsetY: offsetY) {
                    navigation.navigate(to: .settings)
                }

                VStack(spacing: 16) {
                    UserInfoView()
                    DashboardStatsView()

                    VStack(spacing: 16) {
                        Button(action: {
                            navigation.navigate(to: .updates)
                        }) {
                            HStack {
                                Image(systemName: "arrow.down.circle.fill")
                                    .font(.title2)
                                    .foregroundColor(.blue)
                                Text("Available Updates")
                                    .font(.body)
                                    .foregroundColor(.primary)
                                Spacer()
                                Text("4")
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .padding(6)
                                    .background(Color.red)
                                    .foregroundColor(.white)
                                    .clipShape(Circle())
                                Image(systemName: "chevron.right")
                                    .font(.caption)
                                    .foregroundColor(.gray)
                            }
                            .padding()
                            .background(Color(.secondarySystemBackground))
                            .cornerRadius(12)
                        }

                        Button(action: {
                            navigation.navigate(to: .detail(itemId: "favorites"))
                        }) {
                            FavoriteMiniAppsView()
                        }
                        .buttonStyle(PlainButtonStyle())

                        SettingsGridView()
                    }
                    .padding(.vertical, 32)
                    .cornerRadius(32)
                    .padding(.horizontal)

                    Text("BUILD 2.4.1 PREMIUM STABLE")
                        .font(.caption2)
                        .fontWeight(.bold)
                        .foregroundColor(.gray.opacity(0.5))
                        .tracking(2)
                }
            }
            .padding(.bottom, 20)
        }
        .scrollPosition($scrollPosition)
        .onScrollGeometryChange(for: CGFloat.self) { geometry in
            geometry.contentOffset.y
        } action: { oldValue, newValue in
            if oldValue != newValue {
                offsetY = newValue
            }
        }
        .background(Color(.systemGray6).opacity(0.5))
        .navigationBarHidden(true)
    }
}
