import SwiftUI

struct SearchResultsViewOld: View {
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
                .foregroundColor(.gray)
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
                                        .foregroundColor(.white)
                                        .font(.title3)
                                )
                            
                            Spacer()
                            
                            Button(action: {}) {
                                Text("GET")
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .foregroundColor(.blue)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 6)
                                    .background(Color(.systemGray6))
                                    .clipShape(Capsule())
                            }
                        }
                        
                        VStack(alignment: .leading, spacing: 4) {
                            Text(item.name)
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(.primary)
                            
                            Text(item.category)
                                .font(.caption)
                                .foregroundColor(.secondary)
                            
                            HStack(spacing: 4) {
                                ForEach(0..<5) { index in
                                    Image(systemName: "star.fill")
                                        .font(.caption2)
                                        .foregroundColor(Double(index) < item.rating ? .orange : .gray.opacity(0.3))
                                }
                                
                                Text(String(format: "%.1f", item.rating))
                                    .font(.caption2)
                                    .foregroundColor(.gray)
                            }
                        }
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(16)
                    .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
                }
            }
            .padding(.horizontal)
        }
    }
}
