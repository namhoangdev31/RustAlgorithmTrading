import SwiftUI
import AdaptiveSwiftUi


struct WalletExclusiveOfferView: View {
    var body: some View {
        ZStack(alignment: .leading) {
            LinearGradient(colors: [Color.black, Color(hex: 0x1A232E)], startPoint: .topLeading, endPoint: .bottomTrailing)
            
            HStack {
                VStack(alignment: .leading, spacing: 8) {
                    Text("EXCLUSIVE OFFER")
                        .font(.caption)
                        .fontWeight(.bold)
                        .adaptiveForegroundStyle(.secondary)
                        .adaptiveTracking(1)
                    
                    Text("Get 5% Cashback on\nyour next transfer")
                        .font(.title3)
                        .fontWeight(.bold)
                        .adaptiveForegroundStyle(.white)
                    
                    AdaptiveButton(action: {}) {
                        Text("ACTIVATE")
                            .font(.caption)
                            .fontWeight(.bold)
                            .adaptiveForegroundStyle(.black)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .background(Color.white)
                            .clipShape(Capsule())
                    }
                    .adaptiveButtonStyle(.plain)
                    .padding(.top, 8)
                }
                
                Spacer()
                
                Image(systemName: "banknote")
                    .font(.system(size: 60))
                    .foregroundColor(.white.opacity(0.1))
                    .offset(x: 20, y: 20)
            }
            .padding(24)
        }
        .adaptiveGlass(cornerRadius: 24)
    }
}
