import ExploreSwiftUI
import SwiftUI

struct UserInfoView: View {
    @EnvironmentObject var navigation: NavigationViewModel

    var body: some View {
        VStack(spacing: 16) {
            // Avatar with Premium Badge
            ZStack(alignment: .bottom) {
                UniButton(action: {
                    navigation.navigate(to: .accountOverview)
                }) {
                    Circle()
                        .stroke(
                            LinearGradient(
                                colors: [.blue, .purple], startPoint: .topLeading,
                                endPoint: .bottomTrailing), lineWidth: 3
                        )
                        .frame(width: 106, height: 106)
                        .overlay(
                            Image(systemName: "person.fill")  // Placeholder for actual avatar
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                                .padding(20)
                                .uniForegroundStyle(.secondary)
                                .background(Color(.systemGray6))
                                .clipShape(Circle())
                                .frame(width: 100, height: 100)
                        )
                }
                .uniButtonStyle(.plain)

                Text("PREMIUM")
                    .font(.caption2)
                    .fontWeight(.bold)
                    .uniForegroundStyle(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.orange)
                    .clipShape(Capsule())
                    .offset(y: 10)
            }
            .padding(.bottom, 10)

            // Name and Bio
            VStack(spacing: 8) {
                Text("Alex Johnson")
                    .font(.title2)
                    .fontWeight(.bold)

                Text("Digital Explorer & Mini-app Enthusiast. Managing 12 workflows daily.")
                    .font(.subheadline)
                    .uniForegroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }

            // Action Buttons
            HStack(spacing: 16) {
                UniButton(action: {}) {
                    Text("Share Link")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .uniForegroundStyle(.primary)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.white)
                        .cornerRadius(30)
                        .overlay(
                            RoundedRectangle(cornerRadius: 30)
                                .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                        )
                }
                .uniButtonStyle(.plain)
            }
            .padding(.horizontal)
            .padding(.top, 8)
        }
        .padding(.vertical)
    }
}
