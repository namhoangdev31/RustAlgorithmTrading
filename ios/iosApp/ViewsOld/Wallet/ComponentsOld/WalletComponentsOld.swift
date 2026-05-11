import SwiftUI

struct WalletPointsCardOld: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Image(systemName: "star.fill")
                .font(.title2)
                .foregroundColor(.cyan)
                .padding(12)
                .background(Color.cyan.opacity(0.1))
                .clipShape(Circle())
            
            Space(height: 4)
            
            Text("1,250")
                .font(.title)
                .fontWeight(.bold)
            
            Text("Loyalty Points")
                .font(.subheadline)
                .foregroundColor(.cyan)
            
            Spacer()
            
            ProgressView(value: 0.6)
                .tint(.cyan)
                .scaleEffect(y: 2)
                .background(Color.gray.opacity(0.1))
                .clipShape(Capsule())
        }
        .padding(20)
        .frame(maxWidth: .infinity, minHeight: 180, alignment: .leading)
        .background(Color.white)
        .cornerRadius(24)
        .shadow(color: Color.black.opacity(0.05), radius: 10, x: 0, y: 5)
    }
    
    private func Space(height: CGFloat) -> some View {
        Color.clear.frame(height: height)
    }
}

struct WalletQuickServicesViewOld: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Quick Services")
                    .font(.headline)
                Spacer()
                Button("See All") {  }
                    .font(.subheadline)
                    .foregroundColor(.cyan)
            }
            .padding(.horizontal)
            
            HStack(spacing: 16) {
                QuickServiceButtonOld(icon: "arrow.left.arrow.right", title: "Transfer")
                QuickServiceButtonOld(icon: "clock.arrow.circlepath", title: "History")
                QuickServiceButtonOld(icon: "gift", title: "Rewards")
            }
            .padding(.horizontal)
        }
    }
}

struct QuickServiceButtonOld: View {
    let icon: String
    let title: String
    
    var body: some View {
        Button(action: {}) {
            VStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(.black)
                    .frame(width: 50, height: 50)
                    .background(Color(.systemGray6))
                    .clipShape(Circle())
                
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(.black)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 20)
            .background(Color.white)
            .cornerRadius(20)
            .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
        }
    }
}


struct WalletExclusiveOfferViewOld: View {
    var body: some View {
        ZStack(alignment: .leading) {
            LinearGradient(colors: [Color.black, Color(white: 0.15)], startPoint: .topLeading, endPoint: .bottomTrailing)
            
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

struct WalletMemberStatusCardOld: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Image(systemName: "rosette")
                .font(.title2)
                .foregroundColor(.orange)
                .padding(12)
                .background(Color.orange.opacity(0.1))
                .clipShape(Circle())
            
            Space(height: 4)
            
            Text("Gold")
                .font(.title)
                .fontWeight(.bold)
            
            Text("Member Status")
                .font(.subheadline)
                .foregroundColor(.cyan) 
            
            Spacer()
            
            Text("VIP BENEFITS")
                .font(.caption2)
                .fontWeight(.bold)
                .foregroundColor(.orange)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(Color.orange.opacity(0.1))
                .clipShape(Capsule())
        }
        .padding(20)
        .frame(maxWidth: .infinity, minHeight: 180, alignment: .leading)
        .background(Color.white)
        .cornerRadius(24)
        .shadow(color: Color.black.opacity(0.05), radius: 10, x: 0, y: 5)
    }
    
    private func Space(height: CGFloat) -> some View {
        Color.clear.frame(height: height)
    }
}
