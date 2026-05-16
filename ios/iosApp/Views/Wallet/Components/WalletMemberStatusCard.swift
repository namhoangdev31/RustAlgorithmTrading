import AdaptiveSwiftUi
import SwiftUI

struct WalletMemberStatusCard: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Image(systemName: "rosette")
                .font(.title2)
                .adaptiveForegroundStyle(.orange)
                .padding(12)
                .background(Color.orange.opacity(0.1))
                .clipShape(Circle())

            Space(height: 4)

            Text("Gold")
                .font(.title)
                .fontWeight(.bold)

            Text("Member Status")
                .font(.subheadline)
                .adaptiveForegroundStyle(.cyan)

            Spacer()

            Text("VIP BENEFITS")
                .font(.caption2)
                .fontWeight(.bold)
                .adaptiveForegroundStyle(.orange)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(Color.orange.opacity(0.1))
                .clipShape(Capsule())
        }
        .padding(20)
        .frame(maxWidth: .infinity, minHeight: 180, alignment: .leading)
        .adaptiveGlass(cornerRadius: 24)
    }

    private func Space(height: CGFloat) -> some View {
        Color.clear.frame(height: height)
    }
}
