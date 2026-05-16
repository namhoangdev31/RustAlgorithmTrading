import SwiftUI
import AdaptiveSwiftUi

struct MiniAppActivityCardView: View {
    let appName: String
    let description: String
    let timeAgo: String
    let iconColor: Color
    let actionTitle: String
    var isUnread: Bool = false
    
    var body: some View {
        HStack(alignment: .top, spacing: 16) {
            // App Icon
            RoundedRectangle(cornerRadius: 12)
                .fill(iconColor)
                .frame(width: 48, height: 48)
                .overlay(
                    Image(systemName: "cube.box.fill") // Placeholder icon
                        .foregroundColor(.white)
                )
            
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(appName)
                        .font(.headline)
                        .foregroundColor(.primary)
                    
                    Text(timeAgo)
                        .font(.caption)
                        .foregroundColor(.gray)
                    
                    Spacer()
                    
                    if isUnread {
                        Circle()
                            .fill(Color.blue)
                            .frame(width: 8, height: 8)
                    }
                }
                
                Text(description)
                    .font(.subheadline)
                    .foregroundColor(.gray)
                    .lineLimit(2)
                    .fixedSize(horizontal: false, vertical: true)
            }
            
            Spacer()
            
            AdaptiveButton(action: {}) {
                Text(actionTitle)
                    .font(.caption)
                    .fontWeight(.bold)
                    .adaptiveForegroundStyle(.blue)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Color.blue.opacity(0.1))
                    .cornerRadius(12)
            }
        }
        .padding()
        .background(Color.white)
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
        .padding(.horizontal)
    }
}
