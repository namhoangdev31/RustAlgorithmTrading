import ExploreSwiftUI
import SwiftUI

// MARK: - BrowserView (NavigationStack Container)

/// Entry point used in MainTabView.
/// Shows the Start Page; pushes BrowserDetailView on navigation.
public struct BrowserView: View {
    @ObservedObject var viewModel: BrowserViewModel
    @State private var activeRoute: BrowserRoute? = nil
    @State private var isShowingDetail = false

    public init(viewModel: BrowserViewModel) {
        self.viewModel = viewModel
    }

    public var body: some View {
        UniNavigationStack {
            BrowserStartPageView(viewModel: viewModel) { route in
                activeRoute = route
                isShowingDetail = true
            }
            .uniNavigationDestination(isPresented: $isShowingDetail) {
                if let route = activeRoute {
                    BrowserDetailView(viewModel: viewModel, route: route)
                }
            }
        }
        .sheet(isPresented: $viewModel.showBookmarksList) {
            BrowserBookmarksView(viewModel: viewModel)
        }
    }
}
