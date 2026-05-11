import SwiftUI

struct ResendTimerView: View {
    let timeRemaining: Int
    
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: "clock")
                .font(.caption)
                .foregroundColor(.secondary)
            Text("Resend code in 00:\(String(format: "%02d", timeRemaining))")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
        .background(Color.white)
        .cornerRadius(20)
        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
    }
}
