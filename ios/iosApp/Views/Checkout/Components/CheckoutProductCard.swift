import SwiftUI
// import Shared — replaced by native Swift Shared module

@available(iOS 26.0, *)
struct CheckoutProductCard: View {
    let appName: String
    let appDeveloper: String
    let price: Double
    
    var body: some View {
        VStack(spacing: 16) {
            RoundedRectangle(cornerRadius: 24)
                .fill(LinearGradient(gradient: Gradient(colors: [Color.teal, Color.blue]), startPoint: .topLeading, endPoint: .bottomTrailing))
                .frame(width: 80, height: 80)
                .overlay(
                    Image(systemName: "icloud.fill")
                        .font(.system(size: 40))
                        .foregroundColor(.white)
                )
                .shadow(color: .teal.opacity(0.3), radius: 10, x: 0, y: 5)
            
            Text("ORDER SUMMARY")
                .font(.caption)
                .fontWeight(.bold)
                .foregroundColor(.cyan)
                .padding(.top, 8)
            
            Text(appName)
                .font(.title2)
                .fontWeight(.bold)
            
            Text(appDeveloper)
                .font(.subheadline)
                .foregroundColor(.secondary)
            
            Text(String(format: "$%.2f", price))
                .font(.system(size: 40, weight: .medium, design: .rounded))
                .padding(.top, 4)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 32)
        .background(Color.white)
        .cornerRadius(24)
        .padding(.horizontal)
        .shadow(color: .black.opacity(0.03), radius: 10, x: 0, y: 5)
    }
}
