import SwiftUI
// import Shared — replaced by native Swift Shared module

struct CheckoutViewOld: View {
    let appId: String
    let price: Double
    @EnvironmentObject var navigation: NavigationViewModel
    
    // Mock Data based on appId
    private var appName: String { "CloudStudio Pro" }
    private var appDeveloper: String { "Professional Creative Suite • Monthly" }
    
    // Calculated
    private var tax: Double { price * 0.08 }
    private var total: Double { price + tax }
    
    var body: some View {
        ZStack(alignment: .bottom) {
            
            ScrollView {
                VStack(spacing: 24) {
                    
                    // Product Card
                    CheckoutProductCardOld(
                        appName: appName,
                        appDeveloper: appDeveloper,
                        price: price
                    )
                    
                    // Payment Method
                    CheckoutPaymentMethodViewOld()
                    
                    // Transaction Details
                    CheckoutTransactionDetailsViewOld(
                        price: price,
                        tax: tax
                    )
                    
                    // Footer Text
                    Text("By clicking \"Pay Now\" you agree to our Terms of Service and Privacy Policy. Subscription auto-renews monthly.")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 40)
                        .padding(.bottom, 100)
                }
                .padding(.top)
            }
            
            // Pay Button
            CheckoutPayButtonOld(total: total) {
                // Determine action based on context, potentially dismiss
                navigation.pendingSystemAction?() // If we passed a callback
                
                // Simulate successful payment flow
                // In a real app, this would trigger an async payment process
                // For now, we go to the Success screen
                navigation.navigate(to: .paymentFailed)
            }
        }
        .navigationTitle("Checkout")
        .navigationBarTitleDisplayMode(.inline)
    }
}
