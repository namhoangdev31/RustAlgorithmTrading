import SwiftUI

@available(iOS 26.0, *)
struct WalletMemberStatusCard: View {
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
