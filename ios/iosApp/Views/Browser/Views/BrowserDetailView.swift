import ExploreSwiftUI
import SwiftUI

// MARK: - Full-screen Browser Detail View

/// Pushed from NavigationStack — TabView auto-hides.
/// Contains WebView + bottom address bar (Safari-style).
public struct BrowserDetailView: View {
    @ObservedObject var viewModel: BrowserViewModel
    let route: BrowserRoute
    @Environment(\.dismiss) private var dismiss

    @State private var showMoreMenu = false
    @State private var didInitialLoad = false

    public init(viewModel: BrowserViewModel, route: BrowserRoute) {
        self.viewModel = viewModel
        self.route = route
    }

    public var body: some View {
        ZStack(alignment: .bottom) {
            // Content area
            contentArea

            // Bottom toolbar
            bottomBar
        }
        .ignoresSafeArea(edges: .bottom)
        .navigationBarHidden(true)
        .uniToolbarBackground(.hidden, for: .tabBar)
        .onAppear { handleInitialRoute() }
        // MARK: Sheets
        .sheet(isPresented: $viewModel.showTabSwitcher) {
            BrowserTabSwitcherView(viewModel: viewModel)
        }
        .sheet(isPresented: $viewModel.showBookmarksList) {
            BrowserBookmarksView(viewModel: viewModel)
        }
        .sheet(isPresented: $viewModel.showHistoryList) {
            BrowserHistoryView(viewModel: viewModel)
        }
        .confirmationDialog("", isPresented: $showMoreMenu, titleVisibility: .hidden) {
            Button("Tab mới") {
                viewModel.createNewTab()
            }
            Button("Tab riêng tư mới") {
                viewModel.isPrivateMode = true
                viewModel.createNewTab()
            }
            Button("Thêm dấu trang") {
                viewModel.addCurrentToBookmarks()
            }
            Button("Dấu trang") {
                viewModel.showBookmarksList = true
            }
            Button("Lịch sử") {
                viewModel.showHistoryList = true
            }
            Button("Tất cả các tab") {
                viewModel.showTabSwitcher = true
            }
            Button("Huỷ", role: .cancel) {}
        }
    }

    // MARK: - Initial Route

    private func handleInitialRoute() {
        guard !didInitialLoad else { return }
        didInitialLoad = true

        switch route {
        case .search:
            // Address bar will auto-focus via searchOnAppear
            break
        case .url(let urlString):
            viewModel.loadURLString(urlString)
        }
    }

    // MARK: - Content Area

    @ViewBuilder
    private var contentArea: some View {
        if let activeTab = viewModel.activeTab {
            ZStack {
                // WebView
                BrowserWebView(tabViewModel: activeTab)
                    .ignoresSafeArea(edges: .top)
                    .id(activeTab.id)

                // Error overlay
                if case .failed(let error) = activeTab.pageState {
                    BrowserErrorView(error: error) {
                        activeTab.reload()
                    } onOpenInExternalBrowser: {
                        if let url = activeTab.currentURL {
                            UIApplication.shared.open(url, options: [:], completionHandler: nil)
                        }
                    }
                }

                // Progress bar at top
                VStack {
                    if case .loading(let progress) = activeTab.pageState {
                        ProgressView(value: progress, total: 1.0)
                            .progressViewStyle(LinearProgressViewStyle(tint: .blue))
                            .frame(height: 2)
                            .transition(.opacity)
                    }
                    Spacer()
                }
            }
        } else {
            Color(UIColor.systemBackground)
        }
    }

    // MARK: - Bottom Bar (Safari-style)

    private var bottomBar: some View {
        VStack(spacing: 0) {
            Divider()
            HStack(spacing: 4) {
                // Back button
                navButton(systemImage: "chevron.backward", enabled: viewModel.activeTab?.canGoBack == true) {
                    viewModel.activeTab?.goBack()
                }

                // Address bar pill
                BrowserAddressBar(viewModel: viewModel, focusOnAppear: route == .search)
                    .frame(maxWidth: .infinity)

                // Forward button
                navButton(systemImage: "chevron.forward", enabled: viewModel.activeTab?.canGoForward == true) {
                    viewModel.activeTab?.goForward()
                }

                // More (...)
                moreButton
            }
            .padding(.horizontal, 10)
            .padding(.top, 8)
            .padding(.bottom, max(safeAreaBottom, 8))
            .background(
                Color(UIColor.systemBackground)
                    .opacity(0.92)
                    .background(.regularMaterial)
            )
        }
    }

    private func navButton(systemImage: String, enabled: Bool, action: @escaping () -> Void) -> some View {
        UniButton(action: action) {
            Image(systemName: systemImage)
                .font(.system(size: 19, weight: .regular))
                .foregroundColor(enabled ? .primary : Color(UIColor.tertiaryLabel))
                .frame(width: 36, height: 36)
        }
        .uniButtonStyle(.plain)
        .disabled(!enabled)
    }

    private var moreButton: some View {
        UniButton(action: { showMoreMenu = true }) {
            Image(systemName: "ellipsis")
                .font(.system(size: 16, weight: .medium))
                .foregroundColor(.primary)
                .frame(width: 36, height: 36)
                .background(
                    Circle()
                        .fill(Color(UIColor.secondarySystemFill))
                )
        }
        .uniButtonStyle(.plain)
    }

    private var safeAreaBottom: CGFloat {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .first?.windows.first?.safeAreaInsets.bottom ?? 0
    }
}
