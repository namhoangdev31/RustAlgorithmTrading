import ExploreSwiftUI
import SwiftUI

struct HomeView: View {
    @EnvironmentObject var navigation: NavigationViewModel
    @State private var offsetY: CGFloat = 0

    var body: some View {
        UniScrollView {
            VStack(spacing: 16) {
                HomeHeaderView(offsetY: offsetY) {
                    navigation.navigate(to: .activity)
                }

                UniButton(action: {
                    navigation.navigate(to: .detail(itemId: "editor_choice"))
                }) {
                    EditorChoiceView()
                }
                .uniButtonStyle(.plain)

                UniButton(action: {
                    navigation.navigate(to: .detail(itemId: "apps_we_love"))
                }) {
                    AppsWeLoveView()
                }
                .uniButtonStyle(.plain)

                TopCollectionsView()

                HomePersonalizedSectionView(
                    title: "For You",
                    subtitle: "Based on your recent activity"
                )

                QuickAccessView()
            }
            .padding(.bottom, 20)
            .onCompatScrollOffsetChange { offsetY = $0 }
        }
        .coordinateSpace(name: "scroll")
        .uniBackgroundExtension()
        .navigationBarHidden(true)
    }
}
