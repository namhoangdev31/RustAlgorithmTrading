import SwiftUI
// import Shared — replaced by native Swift Shared module

struct HomeView: View {
    // @StateObject private var viewModel: HomeViewModel
    @EnvironmentObject var navigation: NavigationViewModel
    @State private var scrollPosition = ScrollPosition(y: 0)
    @State private var offsetY: CGFloat = 0
    // init(viewModel: HomeViewModel) {
    //     _viewModel = StateObject(wrappedValue: viewModel)
    // }

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
        .backgroundExtensionEffect()
        .navigationBarHidden(true)
    }
}
