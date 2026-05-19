import ExploreSwiftUI
import SwiftUI

// import Shared — replaced by native Swift Shared module

struct CheckoutPayButton: View {
    let total: Double
    let action: () -> Void

    var body: some View {
        UniButton(action: action) {
            HStack {
                Image(systemName: "lock.fill")
                Text("Pay Now • ")
                    .fontWeight(.bold)
                UniText(total, format: .currency(code: "USD"))
                    .uniBold()
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(
                LinearGradient(
                    gradient: Gradient(colors: [Color.cyan, Color.blue]), startPoint: .leading,
                    endPoint: .trailing)
            )
            .foregroundColor(.white)
            .cornerRadius(16)
            .shadow(color: .cyan.opacity(0.3), radius: 10, x: 0, y: 5)
        }
        .padding()
    }
}
