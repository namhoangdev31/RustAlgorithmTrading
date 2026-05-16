import SwiftUI
import AdaptiveSwiftUi


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
                .adaptiveForegroundStyle(.secondary)
            
            // Name
            VStack(alignment: .leading, spacing: 8) {
                Text("CARDHOLDER NAME")
                    .font(.caption2)
                    .adaptiveForegroundStyle(.secondary)
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
                    .adaptiveForegroundStyle(.secondary)
                HStack {
                    TextField("Number", text: $cardNumber)
                    Image(systemName: "creditcard.fill")
                        .adaptiveForegroundStyle(.secondary)
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
                        .adaptiveForegroundStyle(.secondary)
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
                        .adaptiveForegroundStyle(.secondary)
                    HStack {
                        SecureField("•••", text: $cvv)
                        Image(systemName: "questionmark.circle.fill")
                            .adaptiveForegroundStyle(.secondary)
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
