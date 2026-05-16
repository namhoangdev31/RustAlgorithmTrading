import SwiftUI
import AdaptiveSwiftUi


struct DiscoveryAppItem: Identifiable {
    let id = UUID()
    let name: String
    let category: String
    let description: String
    let tag: String
    let tagColor: Color
    let iconName: String
}

struct DiscoveryAppsWeLoveView: View {
    let item = DiscoveryAppItem(
        name: "SkyBound Explorer",
        category: "Travel & Navigation",
        description: "Discover hidden gems around your city with...",
        tag: "#1 TRAVEL",
        tagColor: .blue.opacity(0.2),
        iconName: "iphone"
    )
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Apps We Love")
                    .font(.title2)
                    .fontWeight(.bold)
                Spacer()
                AdaptiveButton(action: {}) {
                    Text("See All")
                }
                .adaptiveButtonStyle(.plain)
                .adaptiveForegroundStyle(.blue)
            }
            .padding(.horizontal)
            
            AdaptiveScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 16) {
                    ForEach(0..<3) { _ in // Mocking multiple items for scroll
                        VStack(alignment: .leading) {
                            HStack(alignment: .top, spacing: 16) {
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                                    .frame(width: 60, height: 100)
                                    .overlay(
                                        Image(systemName: item.iconName)
                                            .font(.largeTitle)
                                            .adaptiveForegroundStyle(.primary)
                                    )
                                
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(item.name)
                                        .font(.headline)
                                    Text(item.category)
                                        .font(.caption)
                                        .adaptiveForegroundStyle(.secondary)
                                    
                                    Text(item.description)
                                        .font(.caption)
                                        .adaptiveForegroundStyle(.secondary)
                                        .lineLimit(2)
                                        .padding(.top, 4)
                                }
                            }
                            
                            Spacer()
                            
                            HStack {
                                Text(item.tag)
                                    .font(.caption2)
                                    .fontWeight(.bold)
                                    .foregroundColor(.blue)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(item.tagColor)
                                    .cornerRadius(4)
                                
                                Spacer()
                                
                                AdaptiveButton(action: {}) {
                                    Text("GET")
                                        .font(.caption)
                                        .fontWeight(.bold)
                                        .foregroundColor(.white)
                                        .padding(.horizontal, 20)
                                        .padding(.vertical, 6)
                                        .background(Color.blue)
                                        .clipShape(Capsule())
                                }
                            }
                        }
                        .padding(16)
                        .frame(width: 300, height: 180)
                        .background(Color(.systemGray6))
                        .cornerRadius(20)
                    }
                }
                .padding(.horizontal)
            }
        }
    }
}
