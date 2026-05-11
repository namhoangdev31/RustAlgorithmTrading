import SwiftUI

@available(iOS 26.0, *)
struct WalletQuickServicesView: View {
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
                QuickServiceButton(icon: "arrow.left.arrow.right", title: "Transfer")
                QuickServiceButton(icon: "clock.arrow.circlepath", title: "History")
                QuickServiceButton(icon: "gift", title: "Rewards")
            }
            .padding(.horizontal)
        }
    }
}

@available(iOS 26.0, *)
struct QuickServiceButton: View {
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
