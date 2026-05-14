import SwiftUI

struct DiscoveryView: View {
    @EnvironmentObject var navigation: NavigationViewModel
    @State private var scrollPosition = ScrollPosition(y: 0)
    @State private var offsetY: CGFloat = 0

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                DiscoveryHeaderView(offsetY: offsetY)
                
                Button(action: {
                    navigation.navigate(to: .detail(itemId: "featured_story"))
                }) {
                    FeaturedStoryView()
                }
                .buttonStyle(PlainButtonStyle())
                
                Button(action: {
                    navigation.navigate(to: .detail(itemId: "discovery_apps"))
                }) {
                    DiscoveryAppsWeLoveView()
                }
                .buttonStyle(PlainButtonStyle())
                
                Button(action: {
                    navigation.navigate(to: .topCharts)
                }) {
                    HStack {
                        Text("Top Charts")
                            .font(.title2)
                            .fontWeight(.bold)
                        Spacer()
                        Image(systemName: "chevron.right")
                            .foregroundColor(.gray)
                    }
                    .padding()
                    .background(Color(.secondarySystemBackground))
                    .cornerRadius(12)
                    .padding(.horizontal)
                }
                .buttonStyle(PlainButtonStyle())
                
                CategoriesView()
                
                TrendingThisWeekView()
            }
        }
        .scrollPosition($scrollPosition)
        .onScrollGeometryChange(for: CGFloat.self) { geometry in
            geometry.contentOffset.y
        } action: { oldValue, newValue in
            if oldValue != newValue {
                offsetY = newValue
            }
        }
        .backgroundExtensionEffect()
        .navigationBarHidden(true)
    }
}
