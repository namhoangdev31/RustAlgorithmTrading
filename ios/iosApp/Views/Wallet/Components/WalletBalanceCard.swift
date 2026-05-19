import ExploreSwiftUI
import SwiftUI

struct WalletBalanceCard: View {
    var balance: Double = 2450.00

    var body: some View {
        VStack(spacing: 20) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("TOTAL BALANCE")
                        .font(.caption)
                        .uniForegroundStyle(.secondary, opacity: 0.8)

                    Text(String(format: "$%.2f", balance))
                        .font(.system(size: 48, weight: .bold))
                        .uniForegroundStyle(.primary)
                }

                Spacer()

                UniButton(action: {
                    // Add money or some other action
                }) {
                    Image(systemName: "plus")
                        .font(.title2)
                        .uniForegroundStyle(.white)
                        .frame(width: 50, height: 50)
                        .background(Color.cyan)
                        .clipShape(Circle())
                        .shadow(color: .cyan.opacity(0.3), radius: 10, x: 0, y: 5)
                }
            }

            HStack(spacing: 32) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("CURRENCY")
                        .font(.caption)
                        .uniForegroundStyle(.cyan)
                    Text("USD / United\nStates")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .uniForegroundStyle(.primary)
                }

                UniDivider().frame(height: 40)

                VStack(alignment: .leading, spacing: 4) {
                    Text("STATUS")
                        .font(.caption)
                        .uniForegroundStyle(.cyan)

                    HStack(spacing: 4) {
                        Circle()
                            .fill(Color.green)
                            .frame(width: 8, height: 8)
                        Text("Verified\nAccount")
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .uniForegroundStyle(.primary)
                    }
                }
                Spacer()
            }
        }
        .padding(24)
        .uniGlass(cornerRadius: 32)
    }
}
