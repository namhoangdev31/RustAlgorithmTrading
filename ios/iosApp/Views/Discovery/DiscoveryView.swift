import SwiftUI
import AdaptiveSwiftUi

struct DiscoveryView: View {
    @EnvironmentObject var navigation: NavigationViewModel
    @State private var offsetY: CGFloat = 0

    var body: some View {
        AdaptiveScrollView {
            VStack(spacing: 16) {
                DiscoveryHeaderView(offsetY: offsetY)
                
                AdaptiveButton(action: {
                    navigation.navigate(to: .detail(itemId: "featured_story"))
                }) {
                    FeaturedStoryView()
                }
                .adaptiveButtonStyle(.plain)

                AdaptiveButton(action: {
                    navigation.navigate(to: .detail(itemId: "discovery_apps"))
                }) {
                    DiscoveryAppsWeLoveView()
                }
                .adaptiveButtonStyle(.plain)

                AdaptiveButton(action: {
                    navigation.navigate(to: .topCharts)
                }) {
                    HStack {
                        Text("Top Charts")
                            .font(.title2)
                            .fontWeight(.bold)
                        Spacer()
                        Image(systemName: "chevron.right")
                            .adaptiveForegroundStyle(.secondary)
                    }
                    .padding()
                    .background(Color(.secondarySystemBackground))
                    .cornerRadius(12)
                    .padding(.horizontal)
                }
                .adaptiveButtonStyle(.plain)

                CategoriesView()
                TrendingThisWeekView()
            }
            .onCompatScrollOffsetChange { offsetY = $0 }
        }
        .coordinateSpace(name: "scroll")
        .adaptiveBackgroundExtension()
        .navigationBarHidden(true)
    }
}
