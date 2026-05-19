import ExploreSwiftUI
import SwiftUI

struct DiscoveryView: View {
    @EnvironmentObject var navigation: NavigationViewModel
    @State private var offsetY: CGFloat = 0

    var body: some View {
        UniScrollView {
            VStack(spacing: 16) {
                DiscoveryHeaderView(offsetY: offsetY)

                UniButton(action: {
                    navigation.navigate(to: .detail(itemId: "featured_story"))
                }) {
                    FeaturedStoryView()
                }
                .uniButtonStyle(.plain)

                UniButton(action: {
                    navigation.navigate(to: .detail(itemId: "discovery_apps"))
                }) {
                    DiscoveryAppsWeLoveView()
                }
                .uniButtonStyle(.plain)

                UniButton(action: {
                    navigation.navigate(to: .topCharts)
                }) {
                    HStack {
                        Text("Top Charts")
                            .font(.title2)
                            .fontWeight(.bold)
                        Spacer()
                        Image(systemName: "chevron.right")
                            .uniForegroundStyle(.secondary)
                    }
                    .padding()
                    .background(Color(.secondarySystemBackground))
                    .cornerRadius(12)
                    .padding(.horizontal)
                }
                .uniButtonStyle(.plain)

                CategoriesView()
                TrendingThisWeekView()
            }
            .onCompatScrollOffsetChange { offsetY = $0 }
        }
        .coordinateSpace(name: "scroll")
        .uniBackgroundExtension()
        .navigationBarHidden(true)
    }
}
