import SwiftUI
import AdaptiveSwiftUi


struct InstalledApp: Identifiable {
    let id = UUID()
    let name: String
    let version: String
    let size: String
    let iconName: String
    let color: Color
}

struct AllAppsView: View {
    // Mock Data
    let apps: [InstalledApp] = [
        InstalledApp(name: "EcoTrack Pro", version: "2.1.0", size: "45 MB", iconName: "leaf.fill", color: .green),
        InstalledApp(name: "Pixel Art", version: "1.0.5", size: "120 MB", iconName: "paintbrush.fill", color: .purple),
        InstalledApp(name: "CryptoWatch", version: "3.2.1", size: "15 MB", iconName: "bitcoinsign.circle.fill", color: .orange),
        InstalledApp(name: "Zen Space", version: "1.2.0", size: "88 MB", iconName: "heart.fill", color: .pink),
        InstalledApp(name: "Travel Mate", version: "2.0.0", size: "60 MB", iconName: "airplane", color: .cyan),
        InstalledApp(name: "Quick Notes", version: "1.1.2", size: "10 MB", iconName: "note.text", color: .yellow)
    ]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("All Apps")
                .font(.title3)
                .fontWeight(.bold)
                .padding(.horizontal)
            
            VStack(spacing: 0) {
                ForEach(apps) { app in
                    HStack(spacing: 12) {
                        RoundedRectangle(cornerRadius: 10)
                            .fill(app.color)
                            .frame(width: 40, height: 40)
                            .overlay(
                                Image(systemName: app.iconName)
                                    .foregroundColor(.white)
                            )
                        
                        VStack(alignment: .leading, spacing: 2) {
                            Text(app.name)
                                .font(.headline)
                            Text("Ver \(app.version) • \(app.size)")
                                .font(.caption)
                                .adaptiveForegroundStyle(.secondary)
                        }
                        
                        Spacer()
                        
                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .adaptiveForegroundStyle(.secondary)
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    
                    if app.id != apps.last?.id {
                        AdaptiveDivider()
                            .padding(.leading, 68)
                    }
                }
            }
            .adaptiveGlass(cornerRadius: 16)
            .padding(.horizontal)
        }
    }
}
