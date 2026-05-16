import SwiftUI
import AdaptiveSwiftUi


struct QuickAccessView: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Quick Access")
                .font(.title2)
                .fontWeight(.bold)
                .padding(.horizontal)
            
            HStack(spacing: 16) {
                // Large item
                RoundedRectangle(cornerRadius: 20)
                    .fill(Color(.clear))
                    .adaptiveGlass(cornerRadius: 20)
                    .overlay(
                        VStack(alignment: .leading) {
                            Image(systemName: "wallet.pass.fill")
                                .font(.largeTitle)
                                .adaptiveForegroundStyle(.blue)
                                .padding(12)
                                .background(Color.blue.opacity(0.1))
                                .adaptiveGlass(cornerRadius: 12)
                            
                            Spacer()
                            
                            Text("Wallet")
                                .font(.headline)
                            Text("Quick payments")
                                .font(.caption)
                                .adaptiveForegroundStyle(.secondary)
                        }
                        .padding(16)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    )
                    .frame(height: 150)
                
                // Stack of smaller items
                VStack(spacing: 16) {
                    quickActionItem(icon: "qrcode.viewfinder", title: "Scan", color: .blue)
                    quickActionItem(icon: "paperplane.fill", title: "Send", color: .blue)
                }
            }
            .padding(.horizontal)
        }
    }
    
    private func quickActionItem(icon: String, title: String, color: Color) -> some View {
        RoundedRectangle(cornerRadius: 20)
            .fill(Color(.clear))
            .adaptiveGlass(cornerRadius: 20)
            .overlay(
                HStack {
                    Image(systemName: icon)
                        .adaptiveForegroundStyle(color)
                    Text(title)
                        .fontWeight(.medium)
                    Spacer()
                }
                .padding(.horizontal, 16)
            )
    }
}
