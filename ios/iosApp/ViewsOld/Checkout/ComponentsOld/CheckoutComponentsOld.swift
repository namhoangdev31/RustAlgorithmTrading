import SwiftUI
// import Shared — replaced by native Swift Shared module

struct CheckoutPayButtonOld: View {
    let total: Double
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack {
                Image(systemName: "lock.fill")
                Text("Pay Now • \(String(format: "$%.2f", total))")
                    .fontWeight(.bold)
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(LinearGradient(gradient: Gradient(colors: [Color.cyan, Color.blue]), startPoint: .leading, endPoint: .trailing))
            .foregroundColor(.white)
            .cornerRadius(16)
            .shadow(color: .cyan.opacity(0.3), radius: 10, x: 0, y: 5)
        }
        .padding()
    }
}

struct CheckoutPaymentMethodCardOld<Content: View>: View {
    let isSelected: Bool
    let content: Content
    
    init(isSelected: Bool, @ViewBuilder content: () -> Content) {
        self.isSelected = isSelected
        self.content = content()
    }
    
    var body: some View {
        ZStack(alignment: .topTrailing) {
            content
                .padding(16)
                .frame(width: 140, height: 100, alignment: .leading)
                .background(isSelected ? Color.cyan.opacity(0.1) : Color.white)
                .cornerRadius(16)
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(isSelected ? Color.cyan : Color.clear, lineWidth: 2)
                )
            
            if isSelected {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(.cyan)
                    .padding(8)
            }
        }
    }
}

struct CheckoutPaymentMethodViewOld: View {
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
                    CheckoutPaymentMethodCardOld(isSelected: true) {
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
                    CheckoutPaymentMethodCardOld(isSelected: false) {
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
                    CheckoutPaymentMethodCardOld(isSelected: false) {
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

struct CheckoutProductCardOld: View {
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

struct CheckoutTransactionDetailsViewOld: View {
    let price: Double
    let tax: Double
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("TRANSACTION DETAILS")
                .font(.caption)
                .fontWeight(.bold)
                .foregroundColor(.secondary)
                .padding(.bottom, 4)
            
            CheckoutDetailRowOld(label: "Subscription Subtotal", value: String(format: "$%.2f", price))
            CheckoutDetailRowOld(label: "Service Fee", value: "$0.00")
            CheckoutDetailRowOld(label: "Estimated Tax", value: String(format: "$%.2f", tax))
        }
        .padding(24)
        .background(Color.white)
        .cornerRadius(24)
        .padding(.horizontal)
        .shadow(color: .black.opacity(0.03), radius: 10, x: 0, y: 5)
    }
}

struct CheckoutDetailRowOld: View {
    let label: String
    let value: String
    
    var body: some View {
        HStack {
            Text(label)
                .foregroundColor(.secondary)
            Spacer()
            Text(value)
                .fontWeight(.semibold)
        }
        .font(.subheadline)
    }
}
