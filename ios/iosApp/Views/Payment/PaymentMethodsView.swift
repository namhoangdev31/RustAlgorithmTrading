import ExploreSwiftUI
import SwiftUI

// import Shared — replaced by native Swift Shared module

struct PaymentMethodsView: View {
    @EnvironmentObject var navigation: NavigationViewModel

    // Mock Data
    @State private var balance: Double = 1248.50
    @State private var primaryMethod: PaymentMethod = .applePay
    @State private var savedMethods: [PaymentMethod] = [
        .visa(last4: "4242"),
        .mastercard(last4: "8812"),
        .bank(name: "Global Savings", bankName: "CHASE", last4: "9012"),
    ]

    var body: some View {
        UniScrollView {
            VStack(spacing: 24) {
                // Wallet Balance Card
                WalletBalanceCard(balance: balance)

                // Primary Method Section
                VStack(alignment: .leading, spacing: 12) {
                    Text("PRIMARY METHOD")
                        .font(.caption)
                        .fontWeight(.bold)
                        .uniForegroundStyle(.secondary)
                        .padding(.horizontal)

                    PrimaryMethodRow(method: primaryMethod)
                }

                // Saved Cards & Accounts Section
                VStack(alignment: .leading, spacing: 12) {
                    Text("SAVED CARDS & ACCOUNTS")
                        .font(.caption)
                        .fontWeight(.bold)
                        .uniForegroundStyle(.secondary)
                        .padding(.horizontal)

                    VStack(spacing: 12) {
                        ForEach(savedMethods) { method in
                            SavedMethodRow(method: method)
                        }

                        UniButton(action: {
                            navigation.navigate(to: .addCard)
                        }) {
                            HStack {
                                Image(systemName: "plus.circle.fill")
                                    .uniForegroundStyle(.cyan)
                                Text("Add New Card")
                                    .fontWeight(.semibold)
                                    .uniForegroundStyle(.primary)
                                Spacer()
                            }
                            .padding()
                            .background(Color(.secondarySystemGroupedBackground))
                            .cornerRadius(12)
                        }
                        .uniButtonStyle(.plain)
                    }
                }

                // Footer
                HStack(spacing: 8) {
                    Image(systemName: "checkmark.shield.fill")
                        .uniForegroundStyle(.secondary)
                    Text("PCI-DSS COMPLIANT")
                        .font(.caption)
                        .fontWeight(.bold)
                        .uniForegroundStyle(.secondary)
                }
                .padding(.top, 24)

                Text("Your payment information is encrypted and never stored on our servers.")
                    .font(.caption2)
                    .uniForegroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
                    .padding(.bottom, 40)

                Spacer(minLength: 80)  // Add bottom spacing to prevent cut-off
            }
            .padding(.top)
        }

        .navigationTitle("Payment Methods")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                HStack {
                    UniButton(action: {
                        navigation.navigate(to: .connectWallet)
                    }) {
                        Image(systemName: "link")
                            .font(.system(size: 20))
                            .uniForegroundStyle(.cyan)
                    }
                    .uniButtonStyle(.plain)

                    UniButton(action: {
                        navigation.navigate(to: .addCard)
                    }) {
                        Image(systemName: "plus.circle.fill")
                            .font(.system(size: 24))
                            .uniForegroundStyle(.cyan)
                    }
                    .uniButtonStyle(.plain)
                }
            }
        }
    }
}
