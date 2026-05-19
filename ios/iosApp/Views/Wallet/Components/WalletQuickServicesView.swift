import ExploreSwiftUI
import SwiftUI

struct WalletQuickServicesView: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Quick Services")
                    .font(.headline)
                Spacer()
                UniButton("See All") {}
                    .font(.subheadline)
                    .uniForegroundStyle(.cyan)
                    .uniButtonStyle(.plain)
            }
            .padding(.horizontal)

            HStack(spacing: 16) {
                QuickServiceButton(icon: "arrow.left.arrow.right", title: "Transfer")
                QuickServiceButton(icon: "clock.arrow.circlepath", title: "History")
                QuickServiceButton(icon: "gift", title: "Rewards")
            }
            .padding(.horizontal)
        }
    }
}

struct QuickServiceButton: View {
    let icon: String
    let title: String

    var body: some View {
        UniButton(action: {}) {
            VStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.title2)
                    .uniForegroundStyle(.primary)
                    .frame(width: 50, height: 50)
                    .background(Color(.systemGray6))
                    .clipShape(Circle())

                Text(title)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .uniForegroundStyle(.primary)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 20)
            .uniGlass(cornerRadius: 20)
        }
        .uniButtonStyle(.plain)
    }
}
