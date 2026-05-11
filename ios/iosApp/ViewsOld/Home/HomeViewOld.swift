import SwiftUI

// iOS 16/17/18 – HomeView compatible version
// Replaces: ScrollPosition(y:) + onScrollGeometryChange → PreferenceKey-based tracker
struct HomeViewOld: View {
    @EnvironmentObject var navigation: NavigationViewModel
    @State private var scrollPosition = ScrollPosition(y: 0)
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
        }
        .scrollPosition($scrollPosition)
        .onScrollGeometryChange(for: CGFloat.self) { geometry in
            geometry.contentOffset.y
        } action: { oldValue, newValue in
            if oldValue != newValue {
                offsetY = newValue
                print("offsetY" , offsetY)
            }
        }
        .navigationBarHidden(true)
    }
}
