import ExploreSwiftUI
import SwiftUI

// import Shared — replaced by native Swift Shared module

struct VerificationView: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var navigation: NavigationViewModel
    @State private var pin: String = ""
    @State private var timeRemaining = 45
    let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                UniButton(action: {
                    dismiss()
                }) {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 16, weight: .bold))
                        .uniForegroundStyle(.primary)
                        .padding(8)
                        .background(Color.white)
                        .clipShape(Circle())
                        .shadow(color: .black.opacity(0.1), radius: 2, x: 0, y: 1)
                }
                .uniButtonStyle(.plain)
                Spacer()
            }
            .padding()

            UniScrollView {
                VStack(spacing: 32) {
                    // Title
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Verification")
                            .font(.system(size: 40, weight: .light))
                        Text("Security check for your new card")
                            .font(.body)
                            .uniForegroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal)

                    // OTP Input
                    VerificationCodeInputView(pin: pin)

                    // Resend Timer
                    ResendTimerView(timeRemaining: timeRemaining)

                    // Verify Button
                    UniButton(action: {
                        // Mock success/failure logic
                        let isSuccess = Bool.random()
                        if isSuccess {
                            navigation.navigate(to: .paymentSuccess)
                        } else {
                            navigation.navigate(to: .paymentFailed)
                        }
                    }) {
                        HStack {
                            Image(systemName: "lock.fill")
                            Text("Verify & Add Card")
                        }
                        .font(.headline)
                        .uniForegroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.black)
                        .cornerRadius(32)
                        .padding(.horizontal)
                    }
                    .uniButtonStyle(.plain)

                    // Footer
                    VStack(spacing: 8) {
                        Text("BANK-LEVEL SECURITY")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .uniForegroundStyle(.secondary)
                            .uniTracking(1)

                        HStack(spacing: 4) {
                            Image(systemName: "shield.fill")
                                .font(.caption2)
                            Text("PCI-DSS COMPLIANT")
                                .font(.caption2)
                        }
                        .uniForegroundStyle(.secondary, opacity: 0.7)
                    }
                    .padding(.top, 16)
                }
            }
        }

        .onReceive(timer) { _ in
            if timeRemaining > 0 {
                timeRemaining -= 1
            }
        }
    }
}
