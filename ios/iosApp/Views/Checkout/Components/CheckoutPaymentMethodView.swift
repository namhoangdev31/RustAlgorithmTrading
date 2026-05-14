import SwiftUI
// import Shared — replaced by native Swift Shared module

struct CheckoutPaymentMethodView: View {
    @EnvironmentObject var navigation: NavigationViewModel
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("PAYMENT METHOD")
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundColor(.secondary)
                Spacer()
                Button("Manage") {
                    navigation.navigate(to: .paymentMethods)
                }
                    .font(.caption)
                    .foregroundColor(.cyan)
            }
            .padding(.horizontal)
            
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    // Apple Pay (Selected)
                    CheckoutPaymentMethodCard(isSelected: true) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("iOS")
                                .font(.caption)
                                .fontWeight(.bold)
                                .foregroundColor(.cyan)
                            Spacer()
                            Text("Apple Pay")
                                .font(.subheadline)
                                .fontWeight(.semibold)
                        }
                    }
                    
                    // Visa
                    CheckoutPaymentMethodCard(isSelected: false) {
                        VStack(alignment: .leading, spacing: 8) {
                            Image(systemName: "creditcard.fill")
                                .foregroundColor(.gray)
                            Spacer()
                            Text("VISA")
                                .font(.caption)
                                .fontWeight(.bold)
                                .foregroundColor(.secondary)
                            Text("•••• 4242")
                                .font(.caption)
                                .fontWeight(.bold)
                        }
                    }
                    
                    // Bank
                    CheckoutPaymentMethodCard(isSelected: false) {
                        VStack(alignment: .leading, spacing: 8) {
                            Image(systemName: "banknote.fill")
                                .foregroundColor(.gray)
                            Spacer()
                            Text("BANK")
                                .font(.caption)
                                .fontWeight(.bold)
                                .foregroundColor(.secondary)
                            Text("$142.00")
                                .font(.caption)
                                .fontWeight(.bold)
                        }
                    }
                }
                .padding(.horizontal)
            }
        }
    }
}
