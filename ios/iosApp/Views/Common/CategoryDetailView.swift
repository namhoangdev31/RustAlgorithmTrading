import SwiftUI
import AdaptiveSwiftUi

// import Shared — replaced by native Swift Shared module

struct CategoryDetailView: View {
    let categoryTitle: String
    @EnvironmentObject var navigation: NavigationViewModel
    
    // Mock Apps
    struct MockApp: Identifiable {
        let id = UUID()
        let name: String
        let developer: String
        let rating: Double
        let iconColor: Color
    }
    
    let apps: [MockApp] = [
        MockApp(name: "App One", developer: "Dev Studio A", rating: 4.5, iconColor: .blue),
        MockApp(name: "Super App", developer: "Indie Dev", rating: 4.8, iconColor: .red),
        MockApp(name: "Toolbox Pro", developer: "Utility Corp", rating: 4.2, iconColor: .orange),
        MockApp(name: "Daily Task", developer: "Prod Inc", rating: 4.6, iconColor: .green),
        MockApp(name: "Zen Space", developer: "Mindful", rating: 4.9, iconColor: .purple),
        MockApp(name: "Quick Notes", developer: "FastApps", rating: 4.3, iconColor: .yellow)
    ]
    
    var body: some View {
        AdaptiveScrollView {
            VStack(spacing: 16) {
                headerView
                
                LazyVStack(spacing: 0) {
                    ForEach(apps) { app in
                        appRow(app: app)
                        
                        AdaptiveDivider()
                            .padding(.leading, 92)
                    }
                }
                .background(Color(.secondarySystemGroupedBackground))
                .cornerRadius(16)
                .padding(.horizontal)
            }
            .padding(.vertical)
        }
        .navigationTitle(categoryTitle)
    }
    
    private var headerView: some View {
        RoundedRectangle(cornerRadius: 16)
            .fill(Color.blue.opacity(0.1))
            .frame(height: 120)
            .overlay(
                HStack {
                    VStack(alignment: .leading) {
                        Text("Top in \(categoryTitle)")
                            .font(.title2)
                            .fontWeight(.bold)
                        Text("Handpicked for you")
                            .foregroundColor(.secondary)
                    }
                    Spacer()
                    Image(systemName: "trophy.fill")
                        .font(.system(size: 40))
                        .foregroundColor(.yellow)
                }
                .padding(24)
            )
            .padding(.horizontal)
    }
    
    private func appRow(app: MockApp) -> some View {
        AdaptiveButton(action: {
            navigation.navigate(to: .detail(itemId: app.id.uuidString))
        }) {
            HStack(spacing: 16) {
                RoundedRectangle(cornerRadius: 12)
                    .fill(app.iconColor)
                    .frame(width: 60, height: 60)
                    .overlay(
                        Text(String(app.name.prefix(1)))
                            .foregroundColor(.white)
                            .font(.title2)
                            .fontWeight(.bold)
                    )
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(app.name)
                        .font(.headline)
                        .foregroundColor(.primary)
                    Text(app.developer)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    HStack(spacing: 4) {
                        ForEach(0..<5) { index in
                            Image(systemName: "star.fill")
                                .font(.caption2)
                                .foregroundColor(Double(index) < app.rating ? .orange : .gray.opacity(0.3))
                        }
                    }
                }
                
                Spacer()
                
                AdaptiveButton(action: {}) {
                    Text("GET")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.blue)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 6)
                        .background(Color(.secondarySystemBackground))
                        .clipShape(Capsule())
                }
            }
            .padding()
        }
    }
}
