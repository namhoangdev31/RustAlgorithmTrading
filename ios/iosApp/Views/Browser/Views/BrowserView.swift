import ExploreSwiftUI
import SwiftUI

// MARK: - Full-screen Browser View

/// Displayed when pushed on the global NavigationStack.
public struct BrowserView: View {
    @ObservedObject var viewModel: BrowserViewModel
    let focusOnAppear: Bool
    @EnvironmentObject var navigation: NavigationViewModel
    @Environment(\.dismiss) private var dismiss



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
        .sheet(isPresented: $viewModel.showBookmarksList) {
            BrowserBookmarksView(viewModel: viewModel, initialTab: 0)
        }
        .fullScreenCover(isPresented: $viewModel.showSearchOverlay) {
            BrowserSearchView(viewModel: viewModel, isPresented: $viewModel.showSearchOverlay)
        }
        .onDisappear {
            let inBrowserFlow = navigation.path.contains { route in
                switch route {
                case .browser, .browserTabSwitcher:
                    return true
                default:
                    return false
                }
            }
            if !inBrowserFlow {
                viewModel.reset()
            }
        }
        .onAppear {
            if focusOnAppear {
                viewModel.showSearchOverlay = true
            }
        }
        .onChange(of: viewModel.showSearchOverlay) { show in
            if !show && viewModel.activeTab?.currentURL == nil {
                navigation.goBack()
            }
        }
    }

    // MARK: - Content Area

    @ViewBuilder
    private var contentArea: some View {
        if let activeTab = viewModel.activeTab {
            if activeTab.currentURL == nil {
                BrowserStartPageView(viewModel: viewModel) { route in
                    switch route {
                    case .search:
                        viewModel.showSearchOverlay = true
                    case .url(let url):
                        viewModel.loadURLString(url)
                    }
                }
            } else {
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
            }
        } else {
            BrowserStartPageView(viewModel: viewModel) { route in
                switch route {
                case .search:
                    viewModel.showSearchOverlay = true
                case .url(let url):
                    viewModel.loadURLString(url)
                }
            }
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
                .contextMenu {
                    if let url = viewModel.activeTab?.currentURL {
                        ShareLink(item: url) {
                            Label("Chia sẻ", systemImage: "square.and.arrow.up")
                        }
                    } else {
                        Button(action: {}) {
                            Label("Chia sẻ", systemImage: "square.and.arrow.up")
                        }
                        .disabled(true)
                    }
                    
                    Button {
                        if let query = viewModel.activeTab?.title {
                            UIPasteboard.general.string = query
                        }
                    } label: {
                        Label("Sao chép cụm từ tìm kiếm", systemImage: "doc.on.doc")
                    }
                    
                    Button {
                        if let url = viewModel.activeTab?.currentURL?.absoluteString {
                            UIPasteboard.general.string = url
                        }
                    } label: {
                        Label("Sao chép liên kết", systemImage: "link")
                    }
                    
                    Divider()
                    
                    Menu {
                        Button(action: {}) {
                            Label("Nhóm tab mới", systemImage: "plus")
                        }
                    } label: {
                        Label("Chuyển đổi nhóm tab", systemImage: "rectangle.3.group")
                    }
                    
                    Menu {
                        Button(action: {}) {
                            Label("Nhóm tab mới", systemImage: "plus")
                        }
                    } label: {
                        Label("Di chuyển đến nhóm tab", systemImage: "arrow.up.right.square")
                    }
                    
                    Divider()
                    
                    Button(role: .destructive) {
                        viewModel.closeAllTabs()
                    } label: {
                        Label("Đóng tất cả \(viewModel.tabs.count) tab", systemImage: "xmark")
                    }
                    
                    Button(role: .destructive) {
                        viewModel.closeTab(id: viewModel.activeTabId)
                    } label: {
                        Label("Đóng tab", systemImage: "xmark")
                    }
                }

            if !viewModel.isToolbarCollapsed {
                Menu {
                    ControlGroup {
                        Button {
                            viewModel.showBookmarksList = true
                        } label: {
                            Label("Dấu trang", systemImage: "book")
                        }
                        
                        Button {
                            if let active = viewModel.activeTab {
                                active.captureSnapshot()
                            }
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
                                navigation.navigate(to: .browserTabSwitcher)
                            }
                        } label: {
                            Label("Tất cả các tab", systemImage: "square.on.square")
                        }
                    }

                    Divider()

                    Button {
                        viewModel.isPrivateMode = true
                        viewModel.createNewTab()
                    } label: {
                        Label("Tab riêng tư mới", systemImage: "hand.raised")
                    }

                    Button {
                        viewModel.createNewTab()
                    } label: {
                        Label("Tab mới", systemImage: "plus")
                    }

                    Divider()

                    Button {
                        viewModel.addCurrentToReadingList()
                    } label: {
                        Label("Thêm vào Danh sách đọc", systemImage: "eyeglasses")
                    }

                    Button {
                        viewModel.addCurrentToBookmarks()
                    } label: {
                        Label("Thêm vào Dấu trang", systemImage: "bookmark")
                    }

                    if let url = viewModel.activeTab?.currentURL {
                        ShareLink(item: url) {
                            Label("Chia sẻ", systemImage: "square.and.arrow.up")
                        }
                    } else {
                        Button(action: {}) {
                            Label("Chia sẻ", systemImage: "square.and.arrow.up")
                        }
                        .disabled(true)
                    }
                } label: {
                    Image(systemName: "ellipsis")
                        .font(.system(size: 19, weight: .bold))
                        .foregroundColor(.primary)
                        .frame(width: 30, height: 30)
                        .padding(10)
                        .uniGlass(cornerRadius: 25)
                }
                .menuStyle(.button)
                .transition(.asymmetric(insertion: .scale.combined(with: .opacity), removal: .opacity))
            }
        }
        .padding(.horizontal, 16)
        .padding(.bottom, viewModel.isToolbarCollapsed ? 12 : 24)
        .animation(.spring(response: 0.35, dampingFraction: 0.75), value: viewModel.isToolbarCollapsed)
    }
}
