import SwiftUI

struct WalletExclusiveOfferView: View {
    var body: some View {
        ZStack(alignment: .leading) {
            LinearGradient(colors: [Color.black, Color(hex: 0x1A232E)], startPoint: .topLeading, endPoint: .bottomTrailing)
            
            HStack {
                VStack(alignment: .leading, spacing: 8) {
                    Text("EXCLUSIVE OFFER")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.gray)
                        .tracking(1)
                    
                    Text("Get 5% Cashback on\nyour next transfer")
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                    
                    Button(action: {}) {
                        Text("ACTIVATE")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.black)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .background(Color.white)
                            .clipShape(Capsule())
                    }
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
        .cornerRadius(24)
        .shadow(color: Color.black.opacity(0.2), radius: 15, x: 0, y: 5)
    }
}
