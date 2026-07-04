import ExploreSwiftUI
import SwiftUI

// MARK: - Full-screen Browser View

/// Displayed when pushed on the global NavigationStack.
/// Contains WebView + bottom address bar (Safari-style).
public struct BrowserView: View {
    @ObservedObject var viewModel: BrowserViewModel
    let focusOnAppear: Bool
    @Environment(\.dismiss) private var dismiss

    @State private var showMoreMenu = false

    public init(viewModel: BrowserViewModel, focusOnAppear: Bool = false) {
        self.viewModel = viewModel
        self.focusOnAppear = focusOnAppear
    }

    public var body: some View {
        ZStack(alignment: .bottom) {
            contentArea
                .ignoresSafeArea(edges: .bottom)

            bottomBar
        }
        .navigationBarHidden(true)
        .uniToolbarBackground(.hidden, for: .tabBar)
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
        .onDisappear {
            // Clean up state when exiting the browser view
            if !viewModel.showTabSwitcher && !viewModel.showBookmarksList && !viewModel.showHistoryList {
                viewModel.reset()
            }
        }
    }

    // MARK: - Content Area

    @ViewBuilder
    private var contentArea: some View {
        if let activeTab = viewModel.activeTab {
            ZStack {
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

            }
        } else {
            Color(UIColor.systemBackground)
        }
    }

    private var bottomBar: some View {
        HStack(spacing: 12) {
            UniButton(style: .glass,
                      action: {
                          if viewModel.activeTab?.canGoBack == true {
                              viewModel.activeTab?.goBack()
                          } else {
                              dismiss()
                          }
                      },
            ) {
                Image(systemName: "chevron.left")
                    .font(.system(size: 19, weight: .bold))
                    .foregroundColor(.primary)
                    .frame(width: 20, height: 20)
            }
            .uniButtonBorderShape(.circle)

            BrowserAddressBar(viewModel: viewModel, focusOnAppear: focusOnAppear)
                .frame(maxWidth: .infinity)

            UniButton(style: .glass,action: { showMoreMenu = true }) {
                Image(systemName: "ellipsis")
                    .font(.system(size: 19, weight: .bold))
                    .foregroundColor(.primary)
                    .frame(width: 20, height: 20)
            }
            .uniButtonBorderShape(.circle)
        }
        .padding(.horizontal, 16)
    }
}
