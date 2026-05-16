import SwiftUI
import AdaptiveSwiftUi


struct SearchResultItem: Identifiable {
    let id = UUID()
    let name: String
    let category: String
    let iconName: String
    let iconColor: Color
    let rating: Double
}

struct SearchResultsView: View {
    let query: String
    
    // Mock Data
    let results: [SearchResultItem] = [
        SearchResultItem(name: "Crossfire", category: "Action", iconName: "flame.fill", iconColor: .red, rating: 4.8),
        SearchResultItem(name: "Task Master", category: "Productivity", iconName: "checkmark.circle.fill", iconColor: .blue, rating: 4.5),
        SearchResultItem(name: "EcoLife", category: "Lifestyle", iconName: "leaf.fill", iconColor: .green, rating: 4.2),
        SearchResultItem(name: "Pixel Art", category: "Design", iconName: "paintbrush.fill", iconColor: .purple, rating: 4.7),
        SearchResultItem(name: "FitPulse", category: "Health", iconName: "heart.fill", iconColor: .pink, rating: 4.6),
        SearchResultItem(name: "CryptoWatch", category: "Finance", iconName: "bitcoinsign.circle.fill", iconColor: .orange, rating: 4.3)
    ]
    
    let columns = [
        GridItem(.flexible()),
        GridItem(.flexible())
    ]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Results for \"\(query)\"")
                .font(.headline)
                .adaptiveForegroundStyle(.secondary)
                .padding(.horizontal)
                .padding(.top, 8)
            
            LazyVGrid(columns: columns, spacing: 16) {
                ForEach(results) { item in
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            RoundedRectangle(cornerRadius: 12)
                                .fill(item.iconColor)
                                .frame(width: 48, height: 48)
                                .overlay(
                                    Image(systemName: item.iconName)
                                        .adaptiveForegroundStyle(.white)
                                        .font(.title3)
                                )
                            
                            Spacer()
                            
                            AdaptiveButton(action: {}) {
                                Text("GET")
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .adaptiveForegroundStyle(.blue)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 6)
                                    .background(Color(.systemGray6))
                                    .clipShape(Capsule())
                            }
                            .adaptiveButtonStyle(.plain)
                        }
                        
                        VStack(alignment: .leading, spacing: 4) {
                            Text(item.name)
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(.primary)
                            
                            Text(item.category)
                                .font(.caption)
                                .adaptiveForegroundStyle(.secondary)
                            
                            HStack(spacing: 4) {
                                ForEach(0..<5) { index in
                                    Image(systemName: "star.fill")
                                        .font(.caption2)
                                        .adaptiveForegroundStyle(Double(index) < item.rating ? .orange : .secondary, opacity: Double(index) < item.rating ? 1.0 : 0.3)
                                }
                                
                                Text(String(format: "%.1f", item.rating))
                                    .font(.caption2)
                                    .adaptiveForegroundStyle(.secondary)
                            }
                        }
                    }
                    .padding()
                    .adaptiveGlass(cornerRadius: 16)
                }
            }
            .padding(.horizontal)
        }
    }
}
