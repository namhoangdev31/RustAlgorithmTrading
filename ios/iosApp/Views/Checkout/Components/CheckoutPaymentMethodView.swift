import ExploreSwiftUI
import SwiftUI

// import Shared — replaced by native Swift Shared module

struct CheckoutPaymentMethodView: View {
    @EnvironmentObject var navigation: NavigationViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("PAYMENT METHOD")
                    .font(.caption)
                    .uniBold()
                    .uniForegroundStyle(.secondary)
                Spacer()
                UniButton(action: {
                    navigation.navigate(to: .paymentMethods)
                }) {
                    Text("Manage")
                }
                .font(.caption)
                .uniForegroundStyle(.cyan)
            }
            .padding(.horizontal)

            UniScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    // Apple Pay (Selected)
                    CheckoutPaymentMethodCard(isSelected: true) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("iOS")
                                .font(.caption)
                                .uniBold()
                                .uniForegroundStyle(.cyan)
                            Spacer()
                            Text("Apple Pay")
                                .font(.subheadline)
                                .uniSemi()
                        }
                    }

                    // Visa
                    CheckoutPaymentMethodCard(isSelected: false) {
                        VStack(alignment: .leading, spacing: 8) {
                            Image(systemName: "creditcard.fill")
                                .uniForegroundStyle(.gray)
                            Spacer()
                            Text("VISA")
                                .font(.caption)
                                .uniBold()
                                .uniForegroundStyle(.secondary)
                            Text("•••• 4242")
                                .font(.caption)
                                .uniBold()
                        }
                    }

                    // Bank
                    CheckoutPaymentMethodCard(isSelected: false) {
                        VStack(alignment: .leading, spacing: 8) {
                            Image(systemName: "banknote.fill")
                                .uniForegroundStyle(.gray)
                            Spacer()
                            Text("BANK")
                                .font(.caption)
                                .uniBold()
                                .uniForegroundStyle(.secondary)
                            Text("$142.00")
                                .font(.caption)
                                .uniBold()
                        }
                    }
                }
                .padding(.horizontal)
            }
        }
    }
}
