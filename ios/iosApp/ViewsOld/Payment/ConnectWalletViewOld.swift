import SwiftUI
// import Shared — replaced by native Swift Shared module

struct ConnectWalletViewOld: View {
    @Environment(\.dismiss) var dismiss

    var body: some View {
        ScrollView {
            VStack(spacing: 32) {
                // Title
                SecureConnectionCardOld()
                // Select Provider
                VStack(alignment: .leading, spacing: 16) {
                    Text("SELECT PROVIDER")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.secondary)
                        .padding(.horizontal)

                    VStack(spacing: 16) {
                        WalletProviderRowOld(
                            icon: "p.square.fill",
                            iconColor: .blue,
                            title: "PayPal",
                            subtitle: "Fast, secure checkout"
                        )

                        WalletProviderRowOld(
                            icon: "applelogo",
                            iconColor: .primary,
                            title: "Apple Pay",
                            subtitle: "Native iOS integration"
                        )

                        WalletProviderRowOld(
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
                    WalletFeatureCardOld(
                        icon: "bolt.fill",
                        iconColor: .blue,
                        title: "Instant Top-up",
                        subtitle: "Immediate funds"
                    )

                    WalletFeatureCardOld(
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
                            .foregroundColor(.green)
                        Text("BANK-GRADE ENCRYPTION")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .foregroundColor(.secondary)
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(Color.white)
                    .cornerRadius(20)
                    .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)

                    Text("We use secure tokens to access your wallet. Your\ncredentials are never stored on our servers.")
                        .font(.caption2)
                        .foregroundColor(.secondary.opacity(0.7))
                        .multilineTextAlignment(.center)
                }
                .padding(.bottom, 40)
            }.navigationTitle("Connect Wallet")
        }
    }
}
