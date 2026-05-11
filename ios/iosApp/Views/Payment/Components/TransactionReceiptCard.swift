import SwiftUI

struct TransactionReceiptCard: View {
    let type: PaymentResultType
    
    var body: some View {
        VStack(spacing: 24) {
            if type == .success {
                VStack(spacing: 8) {
                    Text("TOTAL AMOUNT")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.secondary)
                    Text("$45.00")
                        .font(.system(size: 40, weight: .bold))
                }
                
                Divider()
                
                PaymentDetailRow(label: "TRANSACTION ID", value: "#TRX-992031", showCopy: true)
                PaymentDetailRow(label: "DATE", value: "Oct 24, 2023")
                PaymentDetailRow(label: "TIME", value: "10:30 AM")
                
                Button(action: {}) {
                    Text("READY FOR LAUNCH")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.green)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(Color.green.opacity(0.1))
                        .cornerRadius(8)
                }
            } else {
                VStack(spacing: 8) {
                    Text("ATTEMPTED AMOUNT")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.secondary)
                    Text("$45.00")
                        .font(.system(size: 40, weight: .bold))
                }
                
                Divider()
                
                PaymentDetailRow(label: "TRANSACTION ID", value: "#TRX-992031", showCopy: true)
                
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("ERROR CODE")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.secondary)
                        Text("DEC-042")
                            .font(.subheadline)
                            .fontWeight(.medium)
                            .foregroundColor(.red)
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 4) {
                        Text("REASON")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.secondary)
                        Text("Insuff. Funds")
                            .font(.subheadline)
                            .fontWeight(.medium)
                    }
                }
                
                Button(action: {}) {
                    HStack {
                        Circle().fill(Color.red).frame(width: 6, height: 6)
                        Text("ACTION REQUIRED")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.red)
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
            }
        }
        .padding(24)
        .background(Color.white)
        .cornerRadius(24)
        .shadow(color: .black.opacity(0.05), radius: 10, x: 0, y: 5)
        .padding(.horizontal)
    }
}
