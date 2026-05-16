import SwiftUI
import AdaptiveSwiftUi


struct TrendingApp: Identifiable {
    let id = UUID()
    let rank: String
    let name: String
    let category: String
    let iconName: String
    let iconColor: Color
}

struct TrendingThisWeekView: View {
    let apps: [TrendingApp] = [
        TrendingApp(rank: "1", name: "Flow Focus Pro", category: "Productivity • Minimal", iconName: "iphone", iconColor: .white),
        TrendingApp(rank: "2", name: "Pixel Art Studio", category: "Design • Creative", iconName: "paintpalette.fill", iconColor: .purple.opacity(0.2)),
        TrendingApp(rank: "3", name: "Quick QR Lite", category: "Utilities • Fast", iconName: "qrcode", iconColor: .gray.opacity(0.2))
    ]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Trending This Week")
                    .font(.title2)
                    .fontWeight(.bold)
                Spacer()
                Text("UPDATED TODAY")
                    .font(.caption)
                    .fontWeight(.bold)
                    .adaptiveForegroundStyle(.secondary)
            }
            .padding(.horizontal)
            
            VStack(spacing: 20) {
                ForEach(apps) { app in
                    HStack(spacing: 16) {
                        Text(app.rank)
                            .font(.largeTitle)
                            .italic() // Approximate style
                            .fontWeight(.bold)
                            .adaptiveForegroundStyle(.secondary, opacity: 0.3)
                            .frame(width: 30)
                        
                        RoundedRectangle(cornerRadius: 12)
                            .fill(app.iconColor)
                            .frame(width: 60, height: 60)
                            .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.gray.opacity(0.2)))
                            .overlay(
                                Image(systemName: app.iconName)
                                    .font(.title2)
                                    .foregroundColor(.black)
                            )
                        
                        VStack(alignment: .leading, spacing: 4) {
                            Text(app.name)
                                .font(.headline)
                            Text(app.category)
                                .font(.subheadline)
                                .adaptiveForegroundStyle(.secondary)
                        }
                        
                        Spacer()
                        
                        AdaptiveButton(action: {}) {
                            Text("GET")
                                .font(.caption)
                                .fontWeight(.bold)
                                .foregroundColor(.blue)
                                .padding(.horizontal, 20)
                                .padding(.vertical, 8)
                                .background(Color(.systemGray6))
                                .clipShape(Capsule())
                        }
                        .adaptiveButtonStyle(.plain)
                    }
                    .padding(.horizontal)
                }
            }
        }
    }
}
