import ExploreSwiftUI
import SwiftUI

// import Shared — replaced by native Swift Shared module

struct AddCardView: View {
    @Environment(\.dismiss) var dismiss

    // Form State
    @State private var cardName: String = "Johnathan Doe"
    @State private var cardNumber: String = "0000 0000 0000 0000"
    @State private var expiryDate: String = ""
    @State private var cvv: String = ""

    var body: some View {
        VStack(spacing: 0) {
            UniScrollView {
                VStack(spacing: 24) {
                    // Scanner Area
                    ScannerOverlayView(
                        onScan: {
                            // Mock scan action
                        },
                        onEnterManually: {
                            // Mock enter manually action
                        }
                    )
                    .padding(.horizontal)

                    // Form
                    CardFormView(
                        cardName: $cardName,
                        cardNumber: $cardNumber,
                        expiryDate: $expiryDate,
                        cvv: $cvv
                    )
                    .padding(.horizontal)

                    VStack(spacing: 16) {
                        UniButton(action: {
                            dismiss()
                        }) {
                            Text("Save & Continue")
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color(red: 20 / 255, green: 40 / 255, blue: 50 / 255))
                                .uniForegroundStyle(.white)
                                .cornerRadius(16)
                        }
                        .uniButtonStyle(.plain)
                        .shadow(color: .black.opacity(0.2), radius: 10, x: 0, y: 5)

                        HStack(spacing: 8) {
                            Image(systemName: "lock.fill")
                                .font(.caption)
                                .uniForegroundStyle(.green)
                            Text("SECURE CHECKOUT")
                                .font(.caption2)
                                .uniForegroundStyle(.secondary)
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color.gray.opacity(0.1))
                        .cornerRadius(8)

                        Text(
                            "Your data is protected by bank-level 256-bit encryption.\nWe never store your full card number on our servers."
                        )
                        .font(.system(size: 10))
                        .uniForegroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 20)
                    }
                    .padding(20)
                    .background(
                        LinearGradient(
                            gradient: Gradient(colors: [Color.clear, Color(.systemBackground)]),
                            startPoint: .top, endPoint: .bottom
                        )
                        .padding(.top, -40)
                    )
                }
            }
        }

        .navigationTitle("Add New Card")

    }
}

// Helper extension to use UIColor in SwiftUI Color cleanly
extension UIColor {
    func toColor() -> Color {
        return Color(self)
    }
}
