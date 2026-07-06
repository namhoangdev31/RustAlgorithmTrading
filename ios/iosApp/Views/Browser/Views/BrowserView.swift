import ExploreSwiftUI
import SwiftUI

// MARK: - Full-screen Browser View

/// Displayed when pushed on the global NavigationStack.
public struct BrowserView: View {
    @ObservedObject var viewModel: BrowserViewModel
    @EnvironmentObject var navigation: NavigationViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var showExtensionsAlert = false
    @FocusState private var isFindFieldFocused: Bool

    public init(viewModel: BrowserViewModel) {
        self.viewModel = viewModel
    }

    public var body: some View {
        ZStack(alignment: .top) {
            contentArea
                .ignoresSafeArea(edges: .bottom)

            if viewModel.showFindInPage, let activeTab = viewModel.activeTab {
                VStack {
                    HStack(spacing: 8) {
                        Image(systemName: "doc.text.magnifyingglass")
                            .foregroundColor(.secondary)

                        TextField("Tìm trong trang", text: $viewModel.findInPageQuery, onCommit: {
                            activeTab.findInPage(viewModel.findInPageQuery)
                        })
                        .textFieldStyle(PlainTextFieldStyle())
                        .font(.system(size: 14))
                        .focused($isFindFieldFocused)

                        Button(action: {
                            activeTab.findInPage(viewModel.findInPageQuery)
                        }) {
                            Image(systemName: "chevron.down")
                                .foregroundColor(.secondary)
                        }

                        Button(action: {
                            activeTab.findInPage(viewModel.findInPageQuery, backwards: true)
                        }) {
                            Image(systemName: "chevron.up")
                                .foregroundColor(.secondary)
                        }

                        Button("Xong") {
                            isFindFieldFocused = false
                            withAnimation {
                                viewModel.showFindInPage = false
                                viewModel.findInPageQuery = ""
                            }
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
    }

    // MARK: - Content Area

    @ViewBuilder
    private var contentArea: some View {
        if let activeTab = viewModel.activeTab {
            if activeTab.currentURL == nil {
                BrowserStartPageView(viewModel: viewModel) { route in
                    switch route {
                    case .search:
                        navigation.navigate(to: .browserSearch(isPrivate: viewModel.isPrivateMode))
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
                    navigation.navigate(to: .browserSearch(isPrivate: viewModel.isPrivateMode))
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

            BrowserAddressBar(viewModel: viewModel)
                .frame(maxWidth: viewModel.isToolbarCollapsed ? nil : .infinity)
                .frame(minHeight: viewModel.isToolbarCollapsed ? 38 : 46)

            if !viewModel.isToolbarCollapsed {
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
        .padding(.bottom, viewModel.isToolbarCollapsed ? 8 : 12)
        .animation(.spring(response: 0.35, dampingFraction: 0.75), value: viewModel.isToolbarCollapsed)
    }

    private func openTabSwitcher() {
        viewModel.activeTab?.captureSnapshot()
        viewModel.isToolbarCollapsed = false
        viewModel.showFindInPage = false
        DispatchQueue.main.async {
            navigation.navigate(to: .browserTabSwitcher)
        }
    }
}
