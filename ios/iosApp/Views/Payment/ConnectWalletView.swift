import ExploreSwiftUI
import SwiftUI

// import Shared — replaced by native Swift Shared module

struct ConnectWalletView: View {
    @Environment(\.dismiss) var dismiss

    var body: some View {
        UniScrollView {
            VStack(spacing: 32) {
                // Title
                SecureConnectionCard()
                // Select Provider
                VStack(alignment: .leading, spacing: 16) {
                    Text("SELECT PROVIDER")
                        .font(.caption)
                        .fontWeight(.bold)
                        .uniForegroundStyle(.secondary)
                        .padding(.horizontal)

                    VStack(spacing: 16) {
                        WalletProviderRow(
                            icon: "p.square.fill",
                            iconColor: .blue,
                            title: "PayPal",
                            subtitle: "Fast, secure checkout"
                        )

                        WalletProviderRow(
                            icon: "applelogo",
                            iconColor: .primary,
                            title: "Apple Pay",
                            subtitle: "Native iOS integration"
                        )

                        WalletProviderRow(
                            icon: "creditcard.fill",
                            iconColor: .blue,
                            title: "Google Pay",
                            subtitle: "Smart & simple payments"
                        )
                    }
                    .padding(.horizontal)
                }

                // Features Grid
                HStack(spacing: 16) {
                    WalletFeatureCard(
                        icon: "bolt.fill",
                        iconColor: .blue,
                        title: "Instant Top-up",
                        subtitle: "Immediate funds"
                    )

                    WalletFeatureCard(
                        icon: "checkmark.circle.fill",
                        iconColor: .green,
                        title: "Zero Fees",
                        subtitle: "No hidden costs"
                    )
                }
                .padding(.horizontal)

                // Footer
                VStack(spacing: 16) {
                    HStack(spacing: 8) {
                        Image(systemName: "lock.shield.fill")
                            .font(.caption)
                            .uniForegroundStyle(.green)
                        Text("BANK-GRADE ENCRYPTION")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .uniForegroundStyle(.secondary)
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .uniGlass(cornerRadius: 20)

                    Text(
                        "We use secure tokens to access your wallet. Your\ncredentials are never stored on our servers."
                    )
                    .font(.caption2)
                    .uniForegroundStyle(.secondary, opacity: 0.7)
                    .multilineTextAlignment(.center)
                }
                .padding(.bottom, 40)
            }.navigationTitle("Connect Wallet")
        }
    }
}
