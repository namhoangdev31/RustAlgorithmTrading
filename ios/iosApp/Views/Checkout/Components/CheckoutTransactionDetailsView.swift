import ExploreSwiftUI
import SwiftUI

// import Shared — replaced by native Swift Shared module

struct CheckoutTransactionDetailsView: View {
    let price: Double
    let tax: Double

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("TRANSACTION DETAILS")
                .font(.caption)
                .fontWeight(.bold)
                .foregroundColor(.secondary)
                .padding(.bottom, 4)

            CheckoutDetailRow(label: "Subscription Subtotal", value: price)
            CheckoutDetailRow(label: "Service Fee", value: 0.0)
            CheckoutDetailRow(label: "Estimated Tax", value: tax)
        }
        .padding(24)
        .background(Color.white)
        .cornerRadius(24)
        .padding(.horizontal)
        .shadow(color: .black.opacity(0.03), radius: 10, x: 0, y: 5)
    }
}

struct CheckoutDetailRow: View {
    let label: String
    let value: Double

    var body: some View {
        HStack {
            Text(label)
                .foregroundColor(.secondary)
            Spacer()
            UniText(value, format: .currency(code: "USD"))
                .uniSemi()
        }
        .font(.subheadline)
    }
}
