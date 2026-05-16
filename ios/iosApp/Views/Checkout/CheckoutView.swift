import SwiftUI
import AdaptiveSwiftUi
// import Shared — replaced by native Swift Shared module

struct CheckoutView: View {
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

            
            AdaptiveScrollView {
                VStack(spacing: 24) {
                    
                    // Product Card
                    CheckoutProductCard(
                        appName: appName,
                        appDeveloper: appDeveloper,
                        price: price
                    )
                    
                    // Payment Method
                    CheckoutPaymentMethodView()
                    
                    // Transaction Details
                    CheckoutTransactionDetailsView(
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
            CheckoutPayButton(total: total) {
                // Determine action based on context, potentially dismiss
                navigation.pendingSystemAction?() // If we passed a callback
                
                // Simulate successful payment flow
                // In a real app, this would trigger an async payment process
                // For now, we go to the Success screen
                navigation.navigate(to: .paymentFailed)
            }
        }
        .adaptiveNavigationTitle("Checkout")
    }
}

