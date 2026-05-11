import SwiftUI
// import Shared — replaced by native Swift Shared module

enum PaymentResultType {
    case success
    case failure
}

@available(iOS 26.0, *)
struct PaymentResultView: View {
    let type: PaymentResultType
    @EnvironmentObject var navigation: NavigationViewModel
    
    var body: some View {
        VStack {
            ScrollView {
                VStack(spacing: 32) {
                    // Status Icon
                    PaymentResultAnimationView(type: type)
                    
                    // Title
                    VStack(spacing: 8) {
                        Text(type == .success ? "Payment Successful" : "Payment Failed")
                            .font(.title)
                            .fontWeight(.bold)
                        
                        Text(type == .success ?
                             "Your transaction has been processed\nand your mini-app is ready to use." :
                             "Something went wrong. Please check\nyour payment method and try again."
                        )
                        .font(.body)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .lineLimit(3)
                    }
                    .padding(.horizontal)
                    
                    // Details Card
                    TransactionReceiptCard(type: type)
                    
                    // Action Buttons
                    VStack(spacing: 16) {
                        Button(action: {
                            if type == .success {
                                // Launch mini app logic
                                print("Launch Mini App")
                            } else {
                                // Retry logic, go back
                                navigation.goBack()
                            }
                        }) {
                            Text(type == .success ? "Launch Mini App" : "Retry Payment")
                                .font(.headline)
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(type == .success ? Color.green : Color.black)
                                .cornerRadius(32)
                        }
                        
                        Button(action: {
                            navigation.reset()
                        }) {
                            Text(type == .success ? "Back to Home" : "Contact Support")
                                .font(.headline)
                                .foregroundColor(.black)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.white)
                                .cornerRadius(32)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 32)
                                        .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                                )
                        }
                    }
                    .padding(.horizontal)
                    .padding(.bottom, 40)
                }
            }
        }
        .navigationBarBackButtonHidden(true)
        .toolbar {
            if type == .failure {
                ToolbarItem(placement: .topBarLeading) {
                   Button("Account", systemImage: "multiply", action: {
                    navigation.goBack()
                })
                }
            }
        }
    }
}
