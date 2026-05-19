import ExploreSwiftUI
import SwiftUI

struct DashboardStatsView: View {
    @EnvironmentObject var navigation: NavigationViewModel

    var body: some View {
        VStack(spacing: 16) {
            HStack(spacing: 16) {
                // Balance Card (Blue)
                UniButton(action: {
                    navigation.navigate(to: .wallet)
                }) {
                    VStack(alignment: .leading) {
                        HStack {
                            Image(systemName: "wallet.pass.fill")
                                .font(.title2)
                            Spacer()
                            Text("WALLET")
                                .font(.caption2)
                                .fontWeight(.bold)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Color.white.opacity(0.2))
                                .clipShape(Capsule())
                        }

                        Spacer()

                        Text("BALANCE")
                            .font(.caption)
                            .fontWeight(.semibold)
                            .opacity(0.8)

                        Text("$1,284.50")
                            .font(.title2)
                            .fontWeight(.bold)
                    }
                    .uniForegroundStyle(.white)
                    .padding(20)
                    .frame(maxWidth: .infinity, minHeight: 160)
                    .background(
                        LinearGradient(
                            colors: [Color.blue, Color.cyan],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .cornerRadius(24)
                }
                .uniButtonStyle(.plain)

                VStack(spacing: 16) {
                    // Loyalty Points Card (Pink)
                    VStack(alignment: .leading) {
                        HStack(alignment: .top) {
                            Image(systemName: "star.fill")
                                .padding(8)
                                .background(Color.white.opacity(0.2))
                                .clipShape(Circle())
                            Spacer()
                            Text("2.4k")
                                .font(.title2)
                                .fontWeight(.bold)
                        }
                        Spacer()
                        Text("LOYALTY POINTS")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .opacity(0.9)
                    }
                    .uniForegroundStyle(.white)
                    .padding(16)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Color(red: 1.0, green: 0.3, blue: 0.5))  // Pink
                    .cornerRadius(24)

                    // Membership Tier Card (Green)
                    VStack(alignment: .leading) {
                        HStack(alignment: .top) {
                            Image(systemName: "rosette")
                                .font(.title3)
                            Spacer()
                            Text("GOLD TIER")
                                .font(.caption2)
                                .fontWeight(.bold)
                        }

                        Spacer()

                        Text("MEMBERSHIP")
                            .font(.caption2)
                            .opacity(0.9)
                    }
                    .uniForegroundStyle(.white)
                    .padding(16)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Color(red: 0.0, green: 0.7, blue: 0.5))  // Green
                    .cornerRadius(24)
                }
                .frame(minHeight: 160)
            }
        }
        .padding(.horizontal)
    }
}
