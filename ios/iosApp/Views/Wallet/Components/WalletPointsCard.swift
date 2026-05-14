import SwiftUI

struct WalletPointsCard: View {
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
