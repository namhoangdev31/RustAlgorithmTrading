import SwiftUI
import AdaptiveSwiftUi


struct WalletProviderRow: View {
    let icon: String
    let iconColor: Color
    let title: String
    let subtitle: String
    
    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .font(.title2)
                .adaptiveForegroundStyle(iconColor)
                .frame(width: 50, height: 50)
                .background(Color.white)
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                Text(subtitle)
                    .font(.caption)
                    .adaptiveForegroundStyle(.secondary)
            }
            
            Spacer()
            
            AdaptiveButton("Connect") { }
                .font(.subheadline)
                .adaptiveForegroundStyle(.white)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(Color.black)
                .clipShape(Capsule())
                .adaptiveButtonStyle(.plain)
        }
        .padding()
        .adaptiveGlass(cornerRadius: 20)
    }
}
