import SwiftUI
import AdaptiveSwiftUi


struct DigitalWalletCardView: View {
    var body: some View {
        ZStack {
            // Gradient Background
            LinearGradient(colors: [Color.blue, Color.purple], startPoint: .topLeading, endPoint: .bottomTrailing)
                .clipShape(RoundedRectangle(cornerRadius: 30))
            
            VStack(alignment: .leading) {
                HStack {
                    Text("DIGITAL WALLET")
                        .font(.caption)
                        .fontWeight(.bold)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 5)
                        .adaptiveGlass(cornerRadius: 20)
                        .adaptiveForegroundStyle(.white)
                    
                    Spacer()
                    
                    Image(systemName: "wallet.pass.fill")
                        .font(.title2)
                        .adaptiveForegroundStyle(.white)
                        .padding(10)
                        .adaptiveGlass(cornerRadius: 12)
                }
                
                Text("Personal\nAssets")
                    .font(.title)
                    .fontWeight(.bold)
                    .adaptiveForegroundStyle(.white)
                    .padding(.top, 8)
                
                Spacer()
                
                Text("AVAILABLE BALANCE")
                    .font(.caption)
                    .fontWeight(.bold)
                    .adaptiveForegroundStyle(.white, opacity: 0.7)
                
                Text("$12,480.50")
                    .font(.system(size: 36, weight: .bold))
                    .adaptiveForegroundStyle(.white)
                
                Spacer().frame(height: 20)
                
                HStack(spacing: 16) {
                    AdaptiveButton(action: {}) {
                        HStack {
                            Image(systemName: "banknote")
                            Text("Pay")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.white)
                        .adaptiveForegroundStyle(.blue)
                        .cornerRadius(15)
                    }
                    .adaptiveButtonStyle(.plain)
                    
                    AdaptiveButton(action: {}) {
                        HStack {
                            Image(systemName: "paperplane.fill")
                            Text("Transfer")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .adaptiveGlass(cornerRadius: 15)
                        .adaptiveForegroundStyle(.white)
                    }
                    .adaptiveButtonStyle(.plain)
                }
            }
            .padding(24)
        }
        .frame(height: 380)
        .padding(.horizontal)
        .shadow(color: Color.purple.opacity(0.3), radius: 20, x: 0, y: 10)
    }
}
