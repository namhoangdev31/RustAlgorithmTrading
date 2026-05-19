import ExploreSwiftUI
import SwiftUI

struct MiniAppDetailsView: View {
    @EnvironmentObject var navigation: NavigationViewModel
    @StateObject private var viewModel = MiniAppDetailsViewState(appId: "mock_app_1")

    @State private var showNavBarItems: Bool = false
    @State private var showSettings: Bool = false

    let price: Double = 29.99

    public init() {}

    var body: some View {
        ZStack(alignment: .bottom) {
            UniScrollView {
                VStack(spacing: 0) {
                    MiniAppHeaderView(
                        isDownloaded: viewModel.isDownloaded,
                        isLoading: viewModel.isLoading,
                        onOpen: { viewModel.openApp() },
                        onDownload: { viewModel.installApp(price: price, navigation: navigation) },
                        onUninstall: { viewModel.uninstallApp() },
                        onSettings: { showSettings = true }
                    )

                    UniDivider().padding(.horizontal)
                    MiniAppRatingsView()
                    UniDivider().padding(.horizontal)
                    MiniAppWhatsNewView()
                    MiniAppPreviewView()
                    MiniAppDescriptionView()
                    MiniAppReviewView()
                    MiniAppInformationView()
                    UniDivider().padding(.horizontal)
                    RelatedAppsSectionView()
                    Color.clear.frame(height: 60)
                }
                .onCompatScrollOffsetChange { newValue in
                    let shouldShow = newValue > 80
                    if showNavBarItems != shouldShow {
                        withAnimation(.easeInOut(duration: 0.2)) {
                            showNavBarItems = shouldShow
                        }
                    }
                }
            }
            .coordinateSpace(name: "scroll")
            .onAppear {
                viewModel.checkInstallationStatus()
            }

            MiniAppStickyFooterView(
                isDownloaded: viewModel.isDownloaded,
                onOpen: { viewModel.openApp() },
                onDownload: { viewModel.installApp(price: price, navigation: navigation) }
            )
        }
        .toolbar {
            MiniAppDetailsToolbar(
                showNavBarItems: showNavBarItems,
                isDownloaded: viewModel.isDownloaded,
                isLoading: viewModel.isLoading,
                price: price,
                onInstall: { viewModel.installApp(price: price, navigation: navigation) },
                onOpen: { viewModel.openApp() }
            )
        }
        .sheet(isPresented: $showSettings) {
            MiniAppSettingsView()
        }
    }
}
