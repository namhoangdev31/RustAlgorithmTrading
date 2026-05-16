import SwiftUI
import AdaptiveSwiftUi


struct TransactionReceiptCard: View {
    let type: PaymentResultType
    
    var body: some View {
        VStack(spacing: 24) {
            if type == .success {
                VStack(spacing: 8) {
                    Text("TOTAL AMOUNT")
                        .font(.caption)
                        .fontWeight(.bold)
                        .adaptiveForegroundStyle(.secondary)
                    Text("$45.00")
                        .font(.system(size: 40, weight: .bold))
                }
                
                AdaptiveDivider()
                
                PaymentDetailRow(label: "TRANSACTION ID", value: "#TRX-992031", showCopy: true)
                PaymentDetailRow(label: "DATE", value: "Oct 24, 2023")
                PaymentDetailRow(label: "TIME", value: "10:30 AM")
                
                AdaptiveButton(action: {}) {
                    Text("READY FOR LAUNCH")
                        .font(.caption)
                        .fontWeight(.bold)
                        .adaptiveForegroundStyle(.green)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(Color.green.opacity(0.1))
                        .cornerRadius(8)
                }
                .adaptiveButtonStyle(.plain)
            } else {
                VStack(spacing: 8) {
                    Text("ATTEMPTED AMOUNT")
                        .font(.caption)
                        .fontWeight(.bold)
                        .adaptiveForegroundStyle(.secondary)
                    Text("$45.00")
                        .font(.system(size: 40, weight: .bold))
                }
                
                AdaptiveDivider()
                
                PaymentDetailRow(label: "TRANSACTION ID", value: "#TRX-992031", showCopy: true)
                
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("ERROR CODE")
                            .font(.caption)
                            .fontWeight(.bold)
                            .adaptiveForegroundStyle(.secondary)
                        Text("DEC-042")
                            .font(.subheadline)
                            .fontWeight(.medium)
                            .adaptiveForegroundStyle(.red)
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 4) {
                        Text("REASON")
                            .font(.caption)
                            .fontWeight(.bold)
                            .adaptiveForegroundStyle(.secondary)
                        Text("Insuff. Funds")
                            .font(.subheadline)
                            .fontWeight(.medium)
                    }
                }
                
                AdaptiveButton(action: {}) {
                    HStack {
                        Circle()
                            .fill(Color.red)
                            .frame(width: 6, height: 6)
                        Text("ACTION REQUIRED")
                            .font(.caption)
                            .fontWeight(.bold)
                            .adaptiveForegroundStyle(.red)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(Color.red.opacity(0.05))
                    .cornerRadius(8)
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(Color.red.opacity(0.1), lineWidth: 1)
                    )
                }
                .adaptiveButtonStyle(.plain)
            }
        }
        .padding(24)
        .adaptiveGlass(cornerRadius: 24)
        .padding(.horizontal)
    }
}
