import ExploreSwiftUI
import SwiftUI

struct CardFormView: View {
    @Binding var cardName: String
    @Binding var cardNumber: String
    @Binding var expiryDate: String
    @Binding var cvv: String

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("CARD DETAILS")
                .font(.caption)
                .fontWeight(.bold)
                .uniForegroundStyle(.secondary)

            // Name
            VStack(alignment: .leading, spacing: 8) {
                Text("CARDHOLDER NAME")
                    .font(.caption2)
                    .uniForegroundStyle(.secondary)
                TextField("Name", text: $cardName)
                    .padding()
                    .background(Color.white)
                    .cornerRadius(16)
                    .font(.system(size: 16, weight: .medium))
            }

            // Number
            VStack(alignment: .leading, spacing: 8) {
                Text("CARD NUMBER")
                    .font(.caption2)
                    .uniForegroundStyle(.secondary)
                HStack {
                    TextField("Number", text: $cardNumber)
                    Image(systemName: "creditcard.fill")
                        .uniForegroundStyle(.secondary)
                }
                .padding()
                .background(Color.white)
                .cornerRadius(16)
            }

            HStack(spacing: 16) {
                // Expiry
                VStack(alignment: .leading, spacing: 8) {
                    Text("EXPIRY DATE")
                        .font(.caption2)
                        .uniForegroundStyle(.secondary)
                    TextField("MM/YY", text: $expiryDate)
                        .padding()
                        .background(Color.white)
                        .cornerRadius(16)
                        .multilineTextAlignment(.center)
                }

                // CVV
                VStack(alignment: .leading, spacing: 8) {
                    Text("CVV")
                        .font(.caption2)
                        .uniForegroundStyle(.secondary)
                    HStack {
                        SecureField("•••", text: $cvv)
                        Image(systemName: "questionmark.circle.fill")
                            .uniForegroundStyle(.secondary)
                            .font(.caption)
                    }
                    .padding()
                    .background(Color.white)
                    .cornerRadius(16)
                }
            }
        }
        .padding(.horizontal)
    }
}
