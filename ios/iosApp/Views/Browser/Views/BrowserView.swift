import ExploreSwiftUI
import SwiftUI

// MARK: - Full-screen Browser View

/// Displayed when pushed on the global NavigationStack.
public struct BrowserView: View {
    @ObservedObject var viewModel: BrowserViewModel
    @EnvironmentObject var navigation: NavigationViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var showExtensionsAlert = false
    @State private var showClearDataConfirm = false
    @State private var showTabSwitcher = false
    @FocusState private var isFindFieldFocused: Bool

    public init(viewModel: BrowserViewModel) {
        self.viewModel = viewModel
    }

    public var body: some View {
        ZStack(alignment: .top) {
            contentArea
                .ignoresSafeArea(edges: .bottom)

            if viewModel.isAddressBarEditing {
                BrowserSearchSuggestionsOverlay(viewModel: viewModel)
                    .transition(.opacity)
                    .zIndex(10)
            }

            if viewModel.showFindInPage, let activeTab = viewModel.activeTab {
                VStack {
                    HStack(spacing: 8) {
                        Image(systemName: "doc.text.magnifyingglass")
                            .foregroundColor(.secondary)

                        TextField("Tìm trong trang", text: $viewModel.findInPageQuery, onCommit: {
                            performFind(activeTab: activeTab)
                        })
                        .textFieldStyle(PlainTextFieldStyle())
                        .font(.system(size: 14))
                        .focused($isFindFieldFocused)

                        if viewModel.findMatchCount > 0 {
                            Text("\(viewModel.findCurrentIndex)/\(viewModel.findMatchCount)")
                                .font(.system(size: 12, weight: .medium))
                                .foregroundColor(.secondary)
                                .fixedSize()
                        }

                        Button(action: {
                            performFind(activeTab: activeTab)
                        }) {
                            Image(systemName: "chevron.down")
                                .foregroundColor(.secondary)
                        }

                        Button(action: {
                            performFind(activeTab: activeTab, backwards: true)
                        }) {
                            Image(systemName: "chevron.up")
                                .foregroundColor(.secondary)
                        }

                        Button("Xong") {
                            dismissFindInPage(activeTab: activeTab)
                        }
                        .font(.system(size: 14, weight: .semibold))
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .background(Color(UIColor.secondarySystemGroupedBackground))
                    .cornerRadius(12)
                    .shadow(color: .black.opacity(0.12), radius: 6, x: 0, y: 3)
                    .padding(.horizontal, 16)
                    .padding(.top, 10)
                    Spacer()
                }
                .transition(.move(edge: .top).combined(with: .opacity))
                .zIndex(11)
                .onAppear { isFindFieldFocused = true }
            }
        }
        .safeAreaInset(edge: .bottom, spacing: 0) {
            bottomBar
        }
        .navigationBarHidden(true)
        .sheet(isPresented: $viewModel.showBookmarksList) {
            BrowserBookmarksView(viewModel: viewModel, initialTab: 0)
        }
        .sheet(isPresented: $viewModel.showPageDetailsMenu) {
            if let activeTab = viewModel.activeTab {
                BrowserPageDetailsMenuView(viewModel: viewModel, activeTab: activeTab)
            }
        }
        .fullScreenCover(isPresented: $showTabSwitcher) {
            BrowserTabSwitcherView(viewModel: viewModel) {
                showTabSwitcher = false
            }
        }
        .alert("Quản lý phần mở rộng", isPresented: $showExtensionsAlert) {
            Button("OK", role: .cancel) {}
        } message: {
            Text("iOS không cho app bên thứ ba quản lý Safari Extensions trực tiếp. Browser sẽ ẩn các extension chưa hỗ trợ khỏi luồng chính.")
        }
        .alert("Browser", isPresented: Binding(
            get: { viewModel.lastPageActionMessage != nil },
            set: { if !$0 { viewModel.lastPageActionMessage = nil } }
        )) {
            Button("OK", role: .cancel) { viewModel.lastPageActionMessage = nil }
        } message: {
            Text(viewModel.lastPageActionMessage ?? "")
        }
        .alert("Xóa dữ liệu duyệt web?", isPresented: $showClearDataConfirm) {
            Button("Hủy", role: .cancel) {}
            Button("Xóa", role: .destructive) {
                viewModel.clearWebsiteData()
            }
        } message: {
            Text("Tất cả lịch sử, bộ nhớ đệm, cookie và truy vấn tìm kiếm sẽ bị xóa. Hành động này không thể hoàn tác.")
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
            if !showTabSwitcher && !inBrowserFlow {
                viewModel.reset()
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
                        viewModel.urlInputText = ""
                        viewModel.isAddressBarEditing = true
                    case .url(let url):
                        viewModel.loadURLString(url)
                    case .tabSwitcher:
                        showTabSwitcher = true
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
                            if case .webProcessCrashed = error {
                                activeTab.retryAfterCrash()
                            } else {
                                activeTab.reload()
                            }
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
                    viewModel.urlInputText = ""
                    viewModel.isAddressBarEditing = true
                case .url(let url):
                    viewModel.loadURLString(url)
                case .tabSwitcher:
                    showTabSwitcher = true
                }
            }
        }
    }

    private var bottomBar: some View {
        HStack(spacing: (viewModel.isToolbarCollapsed || viewModel.isAddressBarEditing) ? 0 : 8) {
            if !viewModel.isToolbarCollapsed && !viewModel.isAddressBarEditing {
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

            BrowserAddressBar(viewModel: viewModel)
                .frame(maxWidth: (viewModel.isToolbarCollapsed || viewModel.isAddressBarEditing) ? nil : .infinity)
                .frame(minHeight: (viewModel.isToolbarCollapsed || viewModel.isAddressBarEditing) ? 38 : 46)

            if !viewModel.isToolbarCollapsed && !viewModel.isAddressBarEditing {
                Menu {
                    ControlGroup {
                        Button {
                            viewModel.showBookmarksList = true
                        } label: {
                            Label("Dấu trang", systemImage: "book")
                        }
                        
                        Button {
                            openTabSwitcher()
                        } label: {
                            Label("Tất cả các tab", systemImage: "square.on.square")
                        }
                    }

                    Divider()

                    Button {
                        viewModel.createNewTab(isPrivate: true)
                    } label: {
                        Label("Tab riêng tư mới", systemImage: "hand.raised")
                    }

                    Button {
                        viewModel.createNewTab(isPrivate: false)
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

                    Divider()

                    Button(role: .destructive) {
                        showClearDataConfirm = true
                    } label: {
                        Label("Xóa dữ liệu duyệt web", systemImage: "trash")
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
        .padding(.bottom, (viewModel.isToolbarCollapsed || viewModel.isAddressBarEditing) ? 8 : 12)
        .animation(.spring(response: 0.35, dampingFraction: 0.75), value: viewModel.isToolbarCollapsed || viewModel.isAddressBarEditing)
    }

    private func openTabSwitcher() {
        viewModel.isToolbarCollapsed = false
        viewModel.showFindInPage = false
        Task { @MainActor in
            try? await Task.sleep(nanoseconds: 600_000_000)
            showTabSwitcher = true
        }
    }

    private func performFind(activeTab: BrowserTabViewModel, backwards: Bool = false) {
        let query = viewModel.findInPageQuery
        guard !query.isEmpty else { return }
        activeTab.findInPage(query, backwards: backwards)
        activeTab.countFindMatches(query) { current, total in
            viewModel.findCurrentIndex = current
            viewModel.findMatchCount = total
        }
    }

    private func dismissFindInPage(activeTab: BrowserTabViewModel) {
        isFindFieldFocused = false
        activeTab.clearFindHighlights()
        withAnimation {
            viewModel.showFindInPage = false
            viewModel.findInPageQuery = ""
            viewModel.findMatchCount = 0
            viewModel.findCurrentIndex = 0
        }
    }
}
