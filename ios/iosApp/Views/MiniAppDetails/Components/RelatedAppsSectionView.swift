import SwiftUI
import AdaptiveSwiftUi


struct RelatedAppsSectionView: View {
    // Mock Data
    private let relatedApps = [
        (name: "Forest Walk", icon: "tree.fill", color: Color.green),
        (name: "Ocean Sounds", icon: "water.waves", color: Color.blue),
        (name: "Mountain Hike", icon: "mountain.2.fill", color: Color.brown),
        (name: "City Guide", icon: "building.2.fill", color: Color.gray)
    ]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("You Might Also Like")
                .font(.title3)
                .fontWeight(.bold)
                .padding(.horizontal)
            
            AdaptiveScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 16) {
                    ForEach(0..<4) { index in
                        let app = relatedApps[index]
                        
                        VStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 16)
                                .fill(app.color.opacity(0.1))
                                .frame(width: 100, height: 100)
                                .overlay(
                                    Image(systemName: app.icon)
                                        .font(.largeTitle)
                                        .adaptiveForegroundStyle(app.color)
                                )
                            
                            Text(app.name)
                                .font(.subheadline)
                                .fontWeight(.medium)
                                .lineLimit(1)
                                .padding(.top, 4)
                            
                            AdaptiveButton(action: {}) {
                                Text("GET")
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .adaptiveForegroundStyle(.blue)
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 6)
                                    .background(Color.blue.opacity(0.1))
                                    .cornerRadius(12)
                            }
                            .adaptiveButtonStyle(.plain)
                        }
                        .frame(width: 100)
                    }
                }
                .padding(.horizontal)
            }
        }
        .padding(.vertical)
    }
}
