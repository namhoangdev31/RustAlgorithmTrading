import SwiftUI
import AdaptiveSwiftUi


struct WalletPointsCard: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Image(systemName: "star.fill")
                .font(.title2)
                .adaptiveForegroundStyle(.cyan)
                .padding(12)
                .background(Color.cyan.opacity(0.1))
                .clipShape(Circle())
            
            Space(height: 4)
            
            Text("1,250")
                .font(.title)
                .fontWeight(.bold)
            
            Text("Loyalty Points")
                .font(.subheadline)
                .adaptiveForegroundStyle(.cyan)
            
            Spacer()
            
            AdaptiveProgressView("",value: 0.6)
                .scaleEffect(y: 2)
                .background(Color.gray.opacity(0.1))
                .clipShape(Capsule())
        }
        .padding(20)
        .frame(maxWidth: .infinity, minHeight: 180, alignment: .leading)
        .adaptiveGlass(cornerRadius: 24)
    }
    
    private func Space(height: CGFloat) -> some View {
        Color.clear.frame(height: height)
    }
}
