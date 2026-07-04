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
        contentArea
            .safeAreaInset(edge: .bottom, spacing: 0) {
                // Bottom address bar and control toolbar
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
                // WebView ignores safe area top so that website background flows under the status bar (Safari-style)
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

                // Progress bar at top, automatically pushed below notch/status bar by respecting safe area
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
                // Back button: If WebView can go back, go back. Otherwise, go back to Start Page (dismiss).
                navButton(systemImage: "chevron.backward", enabled: true) {
                    if viewModel.activeTab?.canGoBack == true {
                        viewModel.activeTab?.goBack()
                    } else {
                        dismiss()
                    }
                }

                // Address bar pill
                BrowserAddressBar(viewModel: viewModel, focusOnAppear: focusOnAppear)
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
            .padding(.bottom, 8)
        }
        .background(
            Color(UIColor.systemBackground)
                .opacity(0.92)
                .background(.regularMaterial)
                .ignoresSafeArea(edges: .bottom)
        )
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
}
