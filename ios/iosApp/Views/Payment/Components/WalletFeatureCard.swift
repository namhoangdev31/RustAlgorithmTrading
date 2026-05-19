import ExploreSwiftUI
import SwiftUI

struct WalletFeatureCard: View {
    let icon: String
    let iconColor: Color
    let title: String
    let subtitle: String

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Image(systemName: icon)
                .font(.title2)
                .uniForegroundStyle(iconColor)
                .padding(10)
                .background(iconColor.opacity(0.1))
                .clipShape(Circle())

            Spacer()

            Text(title)
                .font(.subheadline)
                .fontWeight(.bold)

            Text(subtitle)
                .font(.caption)
                .uniForegroundStyle(.secondary)
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .frame(height: 140)
        .uniGlass(cornerRadius: 20)
    }
}
