import ExploreSwiftUI
import SwiftUI

struct WalletMemberStatusCard: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Image(systemName: "rosette")
                .font(.title2)
                .uniForegroundStyle(.orange)
                .padding(12)
                .background(Color.orange.opacity(0.1))
                .clipShape(Circle())

            Space(height: 4)

            Text("Gold")
                .font(.title)
                .fontWeight(.bold)

            Text("Member Status")
                .font(.subheadline)
                .uniForegroundStyle(.cyan)

            Spacer()

            Text("VIP BENEFITS")
                .font(.caption2)
                .fontWeight(.bold)
                .uniForegroundStyle(.orange)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(Color.orange.opacity(0.1))
                .clipShape(Capsule())
        }
        .padding(20)
        .frame(maxWidth: .infinity, minHeight: 180, alignment: .leading)
        .uniGlass(cornerRadius: 24)
    }

    private func Space(height: CGFloat) -> some View {
        Color.clear.frame(height: height)
    }
}
