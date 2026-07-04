import ExploreSwiftUI
import SwiftUI

// MARK: - Full-screen Browser View

/// Displayed when pushed on the global NavigationStack.
public struct BrowserView: View {
    @ObservedObject var viewModel: BrowserViewModel
    let focusOnAppear: Bool
    @EnvironmentObject var navigation: NavigationViewModel
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
        HStack(spacing: viewModel.isToolbarCollapsed ? 0 : 8) {
            if !viewModel.isToolbarCollapsed {
                // Grouped Back/Forward block (1 capsule, 2 tap targets)
                HStack(spacing: 8) {
                    UniButton(action: {
                        if viewModel.activeTab?.canGoBack == true {
                            viewModel.activeTab?.goBack()
                        } else {
                            navigation.goBack()
                        }
                    }) {
                        Image(systemName: "chevron.left")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(.primary)
                            .frame(width: 20, height: 20)
                    }
                    .uniButtonStyle(.plain)
                    if viewModel.activeTab?.canGoForward == true {
                        UniButton(action: {
                            viewModel.activeTab?.goForward()
                        }) {
                            Image(systemName: "chevron.right")
                                .font(.system(size: 18, weight: .bold))
                                .foregroundColor(.primary)
                                .frame(width: 20, height: 20)
                        }
                        .uniButtonStyle(.plain)
                    }
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 12)
                .uniGlass()
                .transition(.asymmetric(insertion: .scale.combined(with: .opacity), removal: .opacity))
            }

            BrowserAddressBar(viewModel: viewModel, focusOnAppear: focusOnAppear)
                .frame(maxWidth: viewModel.isToolbarCollapsed ? nil : .infinity)

            if !viewModel.isToolbarCollapsed {
                UniButton(style: .glass, action: { showMoreMenu = true }) {
                    Image(systemName: "ellipsis")
                        .font(.system(size: 19, weight: .bold))
                        .foregroundColor(.primary)
                        .frame(width: 30, height: 30)
                }
                .uniButtonBorderShape(.circle)
                .transition(.asymmetric(insertion: .scale.combined(with: .opacity), removal: .opacity))
            }
        }
        .padding(.horizontal, 16)
        .padding(.bottom, viewModel.isToolbarCollapsed ? 12 : 24)
        .animation(.spring(response: 0.35, dampingFraction: 0.75), value: viewModel.isToolbarCollapsed)
    }
}
