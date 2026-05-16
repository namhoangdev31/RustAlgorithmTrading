import SwiftUI
import AdaptiveSwiftUi


struct WalletBalanceCard: View {
    var balance: Double = 2450.00
    
    var body: some View {
        VStack(spacing: 20) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("TOTAL BALANCE")
                        .font(.caption)
                        .adaptiveForegroundStyle(.secondary, opacity: 0.8)
                    
                    Text(String(format: "$%.2f", balance))
                        .font(.system(size: 48, weight: .bold))
                        .adaptiveForegroundStyle(.primary)
                }
                
                Spacer()
                
                AdaptiveButton(action: {
                    // Add money or some other action
                }) {
                    Image(systemName: "plus")
                        .font(.title2)
                        .adaptiveForegroundStyle(.white)
                        .frame(width: 50, height: 50)
                        .background(Color.cyan)
                        .clipShape(Circle())
                        .shadow(color: .cyan.opacity(0.3), radius: 10, x: 0, y: 5)
                }
            }
            
            HStack(spacing: 32) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("CURRENCY")
                        .font(.caption)
                        .adaptiveForegroundStyle(.cyan)
                    Text("USD / United\nStates")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .adaptiveForegroundStyle(.primary)
                }
                
                AdaptiveDivider().frame(height: 40)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text("STATUS")
                        .font(.caption)
                        .adaptiveForegroundStyle(.cyan)
                    
                    HStack(spacing: 4) {
                        Circle()
                            .fill(Color.green)
                            .frame(width: 8, height: 8)
                        Text("Verified\nAccount")
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .adaptiveForegroundStyle(.primary)
                    }
                }
                Spacer()
            }
        }
        .padding(24)
        .adaptiveGlass(cornerRadius: 32)
    }
}
