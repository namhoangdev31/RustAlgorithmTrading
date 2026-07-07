import ExploreSwiftUI
import SwiftUI

// MARK: - Safari-style Address Bar Wrapper

public struct BrowserAddressBar: View {
    @ObservedObject var viewModel: BrowserViewModel
    
    public init(viewModel: BrowserViewModel) {
        self.viewModel = viewModel
    }

    public var body: some View {
        if let activeTab = viewModel.activeTab {
            BrowserAddressBarContent(viewModel: viewModel, activeTab: activeTab)
        } else {
            // Fallback placeholder if no tab is active
            HStack {
                Spacer()
                Text("Tìm hoặc nhập tên web")
                    .font(.system(size: 14.5, weight: .semibold))
                    .foregroundColor(.secondary)
                Spacer()
            }
            .padding(.vertical, 12)
            .uniGlass()
        }
    }
}

// MARK: - Address Bar Content (Observing Active Tab)

struct BrowserAddressBarContent: View {
    @ObservedObject var viewModel: BrowserViewModel
    @ObservedObject var activeTab: BrowserTabViewModel // Real-time observation of the tab's progress and state
    @EnvironmentObject var navigation: NavigationViewModel
    
    @State private var showExtensionsAlert = false
    @FocusState private var isTextFieldFocused: Bool

    var body: some View {
        Group {
            if viewModel.isAddressBarEditing {
                // Editing State (Full Width Input)
                HStack(spacing: 8) {
                    Image(systemName: "magnifyingglass")
                        .font(.system(size: 14))
                        .foregroundColor(.secondary)
                        .padding(.leading, 14)
                    
                    TextField("Tìm hoặc nhập tên web", text: $viewModel.urlInputText)
                        .font(.system(size: 14.5, weight: .medium))
                        .textFieldStyle(PlainTextFieldStyle())
                        .padding(.vertical, 10)
                        .keyboardType(.webSearch)
                        .focused($isTextFieldFocused)
                        .autocorrectionDisabled()
                        .autocapitalization(.none)
                        .onSubmit {
                            viewModel.submitSearch(viewModel.urlInputText)
                        }
                        .onChange(of: viewModel.urlInputText) { _, newValue in
                            viewModel.fetchGoogleSuggestions(newValue)
                        }
                    
                    if !viewModel.urlInputText.isEmpty {
                        Button {
                            viewModel.urlInputText = ""
                        } label: {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(.secondary)
                        }
                        .buttonStyle(.plain)
                    }
                    
                    Button("Hủy") {
                        viewModel.isAddressBarEditing = false
                        viewModel.syncAddressBar()
                    }
                    .font(.system(size: 14.5, weight: .medium))
                    .foregroundColor(.blue)
                    .padding(.trailing, 14)
                }
                .uniGlass()
                .frame(minHeight: 46)
                .clipShape(Capsule())
                .onAppear {
                    isTextFieldFocused = true
                }
            } else if viewModel.isToolbarCollapsed {
                // Collapsed Compact State
                Button {
                    startEditing()
                } label: {
                    HStack(spacing: 4) {
                        if !isSecureURL && activeTab.currentURL != nil {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .font(.system(size: 10, weight: .semibold))
                                .foregroundColor(.orange)
                        }
                        Text(displayText)
                            .font(.system(size: 12.5, weight: .semibold))
                            .foregroundColor(.primary)
                            .lineLimit(1)
                            .truncationMode(.tail)
                    }
                    .padding(.horizontal, 20)
                    .frame(minHeight: 38)
                    .contentShape(Capsule())
                    .uniGlass()
                    .clipShape(Capsule())
                    .shadow(color: Color.black.opacity(0.08), radius: 6, x: 0, y: 3)
                    .overlay(
                        Capsule()
                            .stroke(Color.primary.opacity(0.08), lineWidth: 0.5)
                    )
                }
                .buttonStyle(.plain)
                .highPriorityGesture(TapGesture().onEnded { _ in startEditing() })
                .contextMenu { addressBarContextMenu }
            } else {
                // Expanded Full Address Bar
                HStack(spacing: 8) {
                    Button(action: startEditing) {
                        HStack(spacing: 8) {
                            Image(systemName: isSecureURL ? "lock.fill" : "exclamationmark.triangle.fill")
                                .font(.system(size: 11, weight: .semibold))
                                .foregroundColor(isSecureURL ? .secondary : .orange)
                            Text(displayText)
                                .font(.system(size: 14.5, weight: .semibold))
                                .foregroundColor(activeTab.currentURL == nil ? .secondary : .primary)
                                .lineLimit(1)
                                .truncationMode(.tail)


                            Spacer(minLength: 0)
                        }
                        .padding(.leading, 14)
                        .frame(maxWidth: .infinity, minHeight: 46, alignment: .leading)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .highPriorityGesture(TapGesture().onEnded { _ in startEditing() })
                    .contextMenu { addressBarContextMenu }

                    BrowserPageSettingsMenuView(
                        viewModel: viewModel,
                        activeTab: activeTab,
                        showExtensionsAlert: $showExtensionsAlert
                    )

                    reloadOrStopButton
                        .padding(.trailing, 14)
                }
                .uniGlass()
                .frame(minHeight: 46)
                .overlay(
                    GeometryReader { geo in
                        VStack {
                            Spacer()
                            if case .loading(let progress) = activeTab.pageState {
                                Color.blue
                                    .frame(width: geo.size.width * CGFloat(progress), height: 3)
                            }
                        }
                    }
                )
                .clipShape(Capsule())
            }
        }
        .alert("Quản lý phần mở rộng", isPresented: $showExtensionsAlert) {
            Button("OK", role: .cancel) {}
        } message: {
            Text("iOS không cho app bên thứ ba quản lý Safari Extensions trực tiếp.")
        }

        .onChange(of: viewModel.isAddressBarEditing) { _, newValue in
            if newValue {
                isTextFieldFocused = true
            }
        }
    }

    // MARK: - Reload / Stop Button

    @ViewBuilder
    private var reloadOrStopButton: some View {
        switch activeTab.pageState {
        case .loading:
            UniButton(action: { activeTab.stopLoading() }) {
                Image(systemName: "xmark")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(.primary)
            }
            .uniButtonStyle(.plain)
        case .loaded:
            UniButton(action: { activeTab.reload() }) {
                Image(systemName: "arrow.clockwise")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(.primary)
            }
            .uniButtonStyle(.plain)
        default:
            EmptyView()
        }
    }

    // MARK: - Context Menu

    @ViewBuilder
    private var addressBarContextMenu: some View {
        if let url = activeTab.currentURL {
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
            UIPasteboard.general.string = activeTab.title
        } label: {
            Label("Sao chép cụm từ tìm kiếm", systemImage: "doc.on.doc")
        }
        
        Button {
            if let urlString = activeTab.currentURL?.absoluteString {
                UIPasteboard.general.string = urlString
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
            viewModel.closeTab(id: activeTab.id)
        } label: {
            Label("Đóng tab", systemImage: "xmark")
        }
    }

    // MARK: - Helpers

    private var displayText: String {
        guard let url = activeTab.currentURL else {
            return "Tìm hoặc nhập tên web"
        }
        let pageTitle = activeTab.title.trimmingCharacters(in: .whitespacesAndNewlines)
        if !pageTitle.isEmpty && pageTitle != "Tab Mới" && pageTitle != "Website" {
            return pageTitle
        }
        return url.host ?? url.absoluteString
    }

    private var isSecureURL: Bool {
        activeTab.currentURL?.scheme?.lowercased() == "https"
    }

    private func startEditing() {
        viewModel.urlInputText = activeTab.currentURL?.absoluteString ?? ""
        viewModel.isAddressBarEditing = true
        viewModel.isToolbarCollapsed = false
        isTextFieldFocused = true
    }
}
