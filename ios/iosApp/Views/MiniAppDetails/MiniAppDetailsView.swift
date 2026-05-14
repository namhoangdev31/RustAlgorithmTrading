import SwiftUI
// import Shared — replaced by native Swift Shared module

struct MiniAppDetailsView: View {
    @EnvironmentObject var navigation: NavigationViewModel
    @StateObject private var viewModel = MiniAppDetailsViewState(appId: "mock_app_1")

    @State private var showNavBarItems: Bool = false
    @State private var showSettings: Bool = false

    // Mock Data
    let price: Double = 29.99

    public init() {
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            ScrollView {
                VStack(spacing: 0) {
                    // Header Section
                    MiniAppHeaderView(
                        isDownloaded: viewModel.isDownloaded,
                        isLoading: viewModel.isLoading,
                        onOpen: {
                            viewModel.openApp()
                        },
                        onDownload: {
                            viewModel.installApp(price: price, navigation: navigation)
                        },
                        onUninstall: {
                            viewModel.uninstallApp()
                        },
                        onSettings: {
                            showSettings = true
                        }
                    )

                    Divider().padding(.horizontal)

                    // Ratings Stats
                    MiniAppRatingsView()

                    Divider().padding(.horizontal)

                    // What's New
                    MiniAppWhatsNewView()

                    // Preview
                    MiniAppPreviewView()

                    // Description
                    MiniAppDescriptionView()

                    // Reviews
                    MiniAppReviewView()

                    // Information
                    MiniAppInformationView()

                    Divider().padding(.horizontal)

                    // Related Apps
                    RelatedAppsSectionView()

                    // Bottom Padding for Sticky Footer
                    Color.clear.frame(height: 60)
                }
            }
            .onScrollGeometryChange(for: CGFloat.self) { geometry in
                geometry.contentOffset.y
            } action: { oldValue, newValue in
                let shouldShow = newValue > 80
                if showNavBarItems != shouldShow {
                    withAnimation(.easeInOut(duration: 0.2)) {
                        showNavBarItems = shouldShow
                    }
                }
            }
            .onAppear {
                viewModel.checkInstallationStatus()
            }

            // Sticky Footer
            MiniAppStickyFooterView(
                isDownloaded: viewModel.isDownloaded,
                onOpen: {
                    viewModel.openApp()
                },
                onDownload: {
                    viewModel.installApp(price: price, navigation: navigation)
                }
            )
        }
        .toolbar {
            MiniAppDetailsToolbar(
                showNavBarItems: showNavBarItems,
                isDownloaded: viewModel.isDownloaded,
                isLoading: viewModel.isLoading,
                price: price,
                onInstall: {
                    viewModel.installApp(price: price, navigation: navigation)
                },
                onOpen: {
                    viewModel.openApp()
                }
            )
        }
        .sheet(isPresented: $showSettings) {
            MiniAppSettingsView()
        }
    }
}
