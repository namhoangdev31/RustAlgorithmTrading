import SwiftUI

struct CategoriesView: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Categories")
                .font(.title2)
                .fontWeight(.bold)
                .padding(.horizontal)
            
            HStack(spacing: 16) {
                // Large Blue Card
                RoundedRectangle(cornerRadius: 20)
                    .fill(Color.blue)
                    .overlay(
                        VStack(alignment: .leading) {
                            Text("Finance")
                                .font(.title)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                            Text("Tools for your future")
                                .font(.subheadline)
                                .foregroundColor(.white.opacity(0.8))
                            
                            Spacer()
                            
                            Text("142 APPS")
                                .font(.caption2)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                                .padding(.horizontal, 10)
                                .padding(.vertical, 5)
                                .background(Color.white.opacity(0.3))
                                .clipShape(Capsule())
                        }
                        .padding(20)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    )
                    .frame(height: 250)
                
                // Right Column
                VStack(spacing: 16) {
                    CategorySmallCard(title: "RETAIL", icon: "bag.fill", color: Color.red.opacity(0.1), iconColor: .red)
                    CategorySmallCard(title: "FOOD", icon: "fork.knife", color: Color.orange.opacity(0.1), iconColor: .orange)
                }
                .frame(width: 120)
            }
            .padding(.horizontal)
        }
    }
}

struct CategorySmallCard: View {
    let title: String
    let icon: String
    let color: Color
    let iconColor: Color
    
    var body: some View {
        RoundedRectangle(cornerRadius: 20)
            .fill(color)
            .overlay(
                VStack(alignment: .leading) {
                    Image(systemName: icon)
                        .font(.title2)
                        .foregroundColor(iconColor)
                    
                    Spacer()
                    
                    Text(title)
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(iconColor)
                }
                .padding(16)
                .frame(maxWidth: .infinity, alignment: .leading)
            )
            .frame(height: 117) // approx half of 250 - spacing
    }
}
