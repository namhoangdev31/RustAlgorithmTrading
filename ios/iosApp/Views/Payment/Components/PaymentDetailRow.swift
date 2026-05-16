import SwiftUI
import AdaptiveSwiftUi


struct PaymentDetailRow: View {
    let label: String
    let value: String
    var showCopy: Bool = false
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(label)
                    .font(.caption)
                    .fontWeight(.bold)
                    .adaptiveForegroundStyle(.secondary)
                Text(value)
                    .font(.subheadline)
                    .fontWeight(.medium)
            }
            Spacer()
            if showCopy {
                Image(systemName: "doc.on.doc")
                    .font(.caption)
                    .adaptiveForegroundStyle(.secondary)
            }
        }
    }
}
