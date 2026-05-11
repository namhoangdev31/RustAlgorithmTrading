import SwiftUI
// import Shared — replaced by native Swift Shared module

struct WalletFeatureCardOld: View {
    let icon: String
    let iconColor: Color
    let title: String
    let subtitle: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(iconColor)
                .padding(10)
                .background(iconColor.opacity(0.1))
                .clipShape(Circle())
            
            Spacer()
            
            Text(title)
                .font(.subheadline)
                .fontWeight(.bold)
            
            Text(subtitle)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .frame(height: 140)
        .background(Color(.secondarySystemBackground))
        .cornerRadius(20)
    }
}
