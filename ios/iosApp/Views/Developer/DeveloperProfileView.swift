import SwiftUI
import AdaptiveSwiftUi


struct DeveloperAppItem: Identifiable {
    let id = UUID()
    let name: String
    let iconName: String
    let category: String
}

struct DeveloperProfileView: View {
    let developerId: String
    @EnvironmentObject var navigation: NavigationViewModel
    
    // Mock Data
    private let developerName = "EcoSolutions Inc."
    private let developerBio = "Creating sustainable digital solutions for a greener future. We build apps that help you track, reduce, and offset your carbon footprint."
    private let website = "ecosolutions.com"
    
    private let apps: [DeveloperAppItem] = [
        DeveloperAppItem(name: "EcoTrack Pro", iconName: "leaf.fill", category: "Lifestyle"),
        DeveloperAppItem(name: "Solar Calc", iconName: "sun.max.fill", category: "Utilities"),
        DeveloperAppItem(name: "Recycle Guide", iconName: "arrow.3.trianglepath", category: "Reference"),
        DeveloperAppItem(name: "Water Wise", iconName: "drop.fill", category: "Health"),
        DeveloperAppItem(name: "Green Eat", iconName: "carrot.fill", category: "Food & Drink")
    ]
    
    var body: some View {
        AdaptiveScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Header
                HStack(alignment: .top, spacing: 16) {
                    RoundedRectangle(cornerRadius: 16)
                        .fill(Color.green.opacity(0.1))
                        .frame(width: 80, height: 80)
                        .overlay(
                            Image(systemName: "buidling.2.fill") // Mock Logo
                                .font(.largeTitle)
                                .foregroundColor(.green)
                        )
                    
                    VStack(alignment: .leading, spacing: 4) {
                        Text(developerName)
                            .font(.title2)
                            .fontWeight(.bold)
                        
                        AdaptiveLink(website, destination: URL(string: "https://example.com")!)
                            .font(.subheadline)
                            .adaptiveForegroundStyle(.blue)
                    }
                    
                    Spacer()
                    
                    AdaptiveButton(action: {
                        // Follow action
                    }) {
                        Text("Follow")
                            .font(.subheadline)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .background(Color.blue)
                            .cornerRadius(20)
                    }
                }
                .padding(.horizontal)
                .padding(.top)
                
                Text(developerBio)
                    .font(.body)
                    .adaptiveForegroundStyle(.secondary)
                    .padding(.horizontal)
                
                AdaptiveDivider()
                    .padding(.horizontal)
                
                Text("More by \(developerName)")
                    .font(.headline)
                    .padding(.horizontal)
                
                // Apps Grid
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 150), spacing: 16)], spacing: 16) {
                    ForEach(apps) { app in
                        VStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 12)
                                .fill(Color.gray.opacity(0.1))
                                .frame(height: 100)
                                .overlay(
                                    Image(systemName: app.iconName)
                                        .font(.largeTitle)
                                        .foregroundColor(.primary)
                                )
                            
                            Text(app.name)
                                .font(.headline)
                                .lineLimit(1)
                            
                            Text(app.category)
                                .font(.caption)
                                .adaptiveForegroundStyle(.secondary)
                        }
                        .onTapGesture {
                            // Navigate to app detail (Mock)
                            print("Tapped ${app.name}")
                        }
                    }
                }
                .padding(.horizontal)
            }
            .padding(.bottom, 30)
        }
        .navigationTitle("Developer")
        .navigationBarTitleDisplayMode(.inline)
    }
}
