import ExploreSwiftUI
import SwiftUI

// MARK: - Safari-style Tab Switcher

public struct BrowserTabSwitcherView: View {
    @ObservedObject var viewModel: BrowserViewModel
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var navigation: NavigationViewModel
    @State private var isSearchActive = false

    public init(viewModel: BrowserViewModel) {
        self.viewModel = viewModel
    }

    public var body: some View {
        ZStack(alignment: .bottom) {
            // Background — Safari uses a dark grouped look
            Color(UIColor.systemGroupedBackground)
                .ignoresSafeArea()

            VStack(spacing: 0) {
                topBar
                    .padding(.top, safeAreaTop)

                // Tab grid
                UniScrollView {
                    let filteredTabs = viewModel.tabs.filter { $0.isPrivate == viewModel.isPrivateMode }
                    
                    LazyVGrid(
                        columns: [
                            GridItem(.flexible(), spacing: 12),
                            GridItem(.flexible(), spacing: 12)
                        ],
                        spacing: 14
                    ) {
                        ForEach(filteredTabs) { tabVM in
                            SafariTabCard(
                                tabVM: tabVM,
                                isActive: tabVM.id == viewModel.activeTabId
                            ) {
                                navigation.selectTab(id: tabVM.id)
                            } onClose: {
                                withAnimation(.spring(response: 0.3)) {
                                    viewModel.closeTab(id: tabVM.id)
                                }
                            } onCopyLink: {
                                if let url = tabVM.currentURL?.absoluteString {
                                    UIPasteboard.general.string = url
                                }
                            } onDuplicate: {
                                viewModel.duplicateTab(tabVM)
                            } onBookmark: {
                                if let url = tabVM.currentURL?.absoluteString {
                                    viewModel.persistenceStore.addBookmark(url: url, title: tabVM.title)
                                }
                            } onCloseOthers: {
                                withAnimation(.spring(response: 0.3)) {
                                    viewModel.closeOtherTabs(keepingId: tabVM.id)
                                }
                            }
                        }
                    }
                    .padding(.horizontal, 14)
                    .padding(.top, 8)
                    .padding(.bottom, 110)
                }
            }

            // Bottom bar pinned at bottom
            bottomBar
        }
        .ignoresSafeArea()
        .navigationBarHidden(true)
        .navigationBarBackButtonHidden(true)
        .sheet(isPresented: $viewModel.showHistoryList) {
            BrowserHistoryView(viewModel: viewModel)
        }
    }

    // MARK: - Top Bar

    private var topBar: some View {
        let currentTabs = viewModel.tabs.filter { $0.isPrivate == viewModel.isPrivateMode }
        return HStack {
            // Left: ellipsis menu (Safari's "..." button)
            Menu {
                Button(action: {
                    viewModel.showHistoryList = true
                }) {
                    Label("Lịch sử", systemImage: "clock")
                }

                Divider()

                Menu {
                    Button {
                        withAnimation {
                            viewModel.tabs.sort { $0.title.localizedCaseInsensitiveCompare($1.title) == .orderedAscending }
                        }
                    } label: {
                        Label("Tiêu đề", systemImage: "textformat")
                    }
                    Button {
                        withAnimation {
                            viewModel.tabs.sort {
                                ($0.currentURL?.host ?? "").localizedCaseInsensitiveCompare($1.currentURL?.host ?? "") == .orderedAscending
                            }
                        }
                    } label: {
                        Label("Trang web", systemImage: "globe")
                    }
                } label: {
                    Label("Sắp xếp các tab theo", systemImage: "arrow.up.arrow.down")
                }

                Button(action: {
                    let urls = currentTabs.compactMap { $0.currentURL?.absoluteString }
                    UIPasteboard.general.string = urls.joined(separator: "\n")
                }) {
                    Label("Sao chép \(currentTabs.count) liên kết", systemImage: "link")
                }

                Button(action: {
                    for tab in currentTabs {
                        if let url = tab.currentURL?.absoluteString {
                            viewModel.persistenceStore.addBookmark(url: url, title: tab.title)
                        }
                    }
                }) {
                    Label("Thêm dấu trang cho \(currentTabs.count) tab", systemImage: "book.badge.plus")
                }

                Divider()

                Button(role: .destructive, action: {
                    withAnimation(.spring(response: 0.3)) {
                        viewModel.closeAllTabs(isPrivate: viewModel.isPrivateMode)
                    }
                }) {
                    Label("Đóng tất cả \(currentTabs.count) tab", systemImage: "xmark")
                }
            } label: {
                Image(systemName: "ellipsis")
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(.primary)
                    .frame(width: 36, height: 36)
                    .background(Circle().fill(Color(UIColor.secondarySystemFill)))
            }

            Spacer()

            // Right: search icon
            UniButton(action: {
                navigation.navigate(to: .browserSearch(isPrivate: viewModel.isPrivateMode))
            }) {
                Image(systemName: "magnifyingglass")
                    .font(.system(size: 17))
                    .foregroundColor(.primary)
                    .frame(width: 36, height: 36)
                    .background(Circle().fill(Color(UIColor.secondarySystemFill)))
            }
            .uniButtonStyle(.plain)
        }
        .padding(.horizontal, 16)
        .padding(.bottom, 8)
    }

    // MARK: - Bottom Bar (Safari-style: + | Riêng tư / N tab | ✓)

    private var bottomBar: some View {
        VStack(spacing: 0) {
            Divider()

            HStack(spacing: 0) {
                // Left: New tab button (+)
                UniButton(action: {
                    navigation.createNewTabFromSwitcher(isPrivate: viewModel.isPrivateMode)
                }) {
                    ZStack {
                        Circle()
                            .fill(Color(UIColor.secondarySystemFill))
                            .frame(width: 32, height: 32)
                        Image(systemName: "plus")
                            .font(.system(size: 18, weight: .medium))
                            .foregroundColor(.primary)
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 44)
                }
                .uniButtonStyle(.plain)

                // Center: Private mode toggle / tab group segment
                HStack(spacing: 0) {
                    Text("Riêng tư")
                        .font(.system(size: 13, weight: viewModel.isPrivateMode ? .semibold : .regular))
                        .foregroundColor(viewModel.isPrivateMode ? .primary : .secondary)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 6)
                        .background(
                            Capsule()
                                .fill(viewModel.isPrivateMode ? Color(UIColor.systemBackground) : Color.clear)
                                .shadow(color: viewModel.isPrivateMode ? .black.opacity(0.12) : .clear, radius: 2, x: 0, y: 1)
                        )
                        .onTapGesture {
                            withAnimation(.spring(response: 0.28, dampingFraction: 0.75)) {
                                viewModel.isPrivateMode = true
                            }
                        }

                    Text(tabCountText)
                        .font(.system(size: 13, weight: !viewModel.isPrivateMode ? .semibold : .regular))
                        .foregroundColor(!viewModel.isPrivateMode ? .primary : .secondary)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 6)
                        .background(
                            Capsule()
                                .fill(!viewModel.isPrivateMode ? Color(UIColor.systemBackground) : Color.clear)
                                .shadow(color: !viewModel.isPrivateMode ? .black.opacity(0.12) : .clear, radius: 2, x: 0, y: 1)
                        )
                        .onTapGesture {
                            withAnimation(.spring(response: 0.28, dampingFraction: 0.75)) {
                                viewModel.isPrivateMode = false
                            }
                        }
                }
                .padding(3)
                .background(Capsule().fill(Color(UIColor.tertiarySystemFill)))
                .frame(maxWidth: .infinity)
                .frame(height: 44)

                UniButton(action: { navigation.closeTabSwitcher() }) {
                    ZStack {
                        Circle()
                            .fill(Color.blue)
                            .frame(width: 32, height: 32)
                        Image(systemName: "checkmark")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.white)
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 44)
                }
                .uniButtonStyle(.plain)
            }
            .padding(.horizontal, 8)
            .padding(.bottom, max(safeAreaBottom, 12))
            .background(
                Color(UIColor.systemBackground)
                    .opacity(0.95)
                    .background(.regularMaterial)
            )
        }
    }

    // MARK: - Helpers

    private var tabCountText: String {
        let count = viewModel.tabs.filter { !$0.isPrivate }.count
        return "\(count) tab"
    }

    private var safeAreaTop: CGFloat {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .first?.windows.first?.safeAreaInsets.top ?? 44
    }

    private var safeAreaBottom: CGFloat {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .first?.windows.first?.safeAreaInsets.bottom ?? 0
    }
}

// MARK: - Tab Card (Safari-style)

struct SafariTabCard: View {
    @ObservedObject var tabVM: BrowserTabViewModel
    let isActive: Bool
    let onTap: () -> Void
    let onClose: () -> Void
    let onCopyLink: () -> Void
    let onDuplicate: () -> Void
    let onBookmark: () -> Void
    let onCloseOthers: () -> Void

    var body: some View {
        ZStack(alignment: .topTrailing) {
            // Card body
            VStack(spacing: 0) {
                // Thumbnail area
                ZStack {
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .fill(Color(UIColor.systemBackground))

                    if let snapshot = tabVM.snapshot {
                        Image(uiImage: snapshot)
                            .resizable()
                            .scaledToFill()
                            .frame(maxWidth: .infinity)
                            .frame(height: 160)
                            .clipped()
                    } else {
                        // Placeholder
                        VStack(spacing: 8) {
                            Image(systemName: tabVM.isPrivate ? "hand.raised.fill" : "safari")
                                .font(.system(size: 36))
                                .foregroundColor(Color(UIColor.quaternaryLabel))

                            if let host = tabVM.currentURL?.host {
                                Text(host)
                                    .font(.caption2)
                                    .foregroundColor(Color(UIColor.tertiaryLabel))
                                    .lineLimit(1)
                            }
                        }
                    }
                }
                .frame(maxWidth: .infinity)
                .frame(height: 160)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

                HStack(spacing: 6) {
                    if tabVM.isPrivate {
                        Image(systemName: "hand.raised.fill")
                            .font(.system(size: 10))
                            .foregroundColor(.purple)
                    } else if let host = tabVM.currentURL?.host {
                        FaviconView(
                            domain: host,
                            size: 16,
                            initial: String(tabVM.title.prefix(1))
                        )
                    } else {
                        Image(systemName: "safari")
                            .font(.system(size: 12))
                            .foregroundColor(.secondary)
                    }

                    Text(tabVM.title)
                        .font(.caption.weight(isActive ? .semibold : .regular))
                        .foregroundColor(.primary)
                        .lineLimit(1)
                        .truncationMode(.tail)

                    Spacer(minLength: 0)
                }
                .padding(.horizontal, 4)
                .padding(.vertical, 6)
            }
            .contentShape(Rectangle())
            .onTapGesture { onTap() }
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .strokeBorder(
                        isActive ? Color.blue : Color(UIColor.separator),
                        lineWidth: isActive ? 2.5 : 0.5
                    )
            )
            // Safari context menu on long press
            .contextMenu {
                // 1. Sao chép liên kết
                Button(action: onCopyLink) {
                    Label("Sao chép liên kết", systemImage: "link")
                }

                Button(action: onDuplicate) {
                    Label("Nhân bản tab", systemImage: "plus.square.on.square")
                }

                Button(action: onBookmark) {
                    Label("Thêm vào dấu trang", systemImage: "book")
                }

                Divider()

                Button(action: onCloseOthers) {
                    Label("Đóng các tab khác", systemImage: "xmark.square")
                }

                Button(role: .destructive, action: onClose) {
                    Label("Đóng tab", systemImage: "xmark")
                }
            }

            // Close (X) button — top-right corner of the card
            UniButton(action: onClose) {
                Image(systemName: "xmark")
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundColor(.primary)
                    .frame(width: 22, height: 22)
                    .background(
                        Circle()
                            .fill(Color(UIColor.systemFill))
                            .shadow(color: .black.opacity(0.1), radius: 2)
                    )
            }
            .uniButtonStyle(.plain)
            .padding(6)
        }
    }
}
