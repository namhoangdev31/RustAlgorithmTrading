import ExploreSwiftUI
import SwiftUI

// import Shared — replaced by native Swift Shared module

enum PaymentResultType {
    case success
    case failure
}

struct PaymentResultView: View {
    let type: PaymentResultType
    @EnvironmentObject var navigation: NavigationViewModel

    var body: some View {
        VStack {
            UniScrollView {
                VStack(spacing: 32) {
                    // Status Icon
                    PaymentResultAnimationView(type: type)

                    // Title
                    VStack(spacing: 8) {
                        Text(type == .success ? "Payment Successful" : "Payment Failed")
                            .font(.title)

                        Text(
                            type == .success
                                ? "Your transaction has been processed\nand your mini-app is ready to use."
                                : "Something went wrong. Please check\nyour payment method and try again."
                        )
                        .font(.body)
                        .uniForegroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                        .lineLimit(3)
                    }
                    .padding(.horizontal)

                    // Details Card
                    TransactionReceiptCard(type: type)

                    // Action Buttons
                    VStack(spacing: 16) {
                        UniButton(action: {
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
                                .uniForegroundStyle(.white)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(type == .success ? Color.green : Color.black)
                                .cornerRadius(32)
                        }
                        .uniButtonStyle(.plain)

                        UniButton(action: {
                            navigation.reset()
                        }) {
                            Text(type == .success ? "Back to Home" : "Contact Support")
                                .font(.headline)
                                .uniForegroundStyle(.primary)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.white)
                                .cornerRadius(32)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 32)
                                        .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                                )
                        }
                        .uniButtonStyle(.plain)
                    }
                    .padding(.horizontal)
                    .padding(.bottom, 40)
                }
            }
        }
        .navigationBarBackButtonHidden(true)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                if type == .failure {
                    UniButton(
                        "Account", systemImage: "multiply",
                        action: {
                            navigation.goBack()
                        }
                    )
                    .uniButtonStyle(.plain)
                }
            }
        }
    }
}
