import SwiftUI
import AdaptiveSwiftUi

struct HomeView: View {
    @EnvironmentObject var navigation: NavigationViewModel
    @State private var offsetY: CGFloat = 0

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                HomeHeaderView(offsetY: offsetY) {
                    navigation.navigate(to: .activity)
                }

                Button(action: {
                    navigation.navigate(to: .detail(itemId: "editor_choice"))
                }) {
                    EditorChoiceView()
                }
                .buttonStyle(PlainButtonStyle())

                Button(action: {
                    navigation.navigate(to: .detail(itemId: "apps_we_love"))
                }) {
                    AppsWeLoveView()
                }
                .buttonStyle(PlainButtonStyle())

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
        .adaptiveBackgroundExtension()
        .navigationBarHidden(true)
    }
}
