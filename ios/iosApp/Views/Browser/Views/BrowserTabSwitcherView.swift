import SwiftUI
import ExploreSwiftUI
import UIKit

public struct BrowserTabSwitcherView: View {
    @ObservedObject var viewModel: BrowserViewModel
    @EnvironmentObject private var navigation: NavigationViewModel
    @State private var searchText = ""
    @State private var sortMode: BrowserTabSortMode = .currentOrder
    private let onDismiss: (() -> Void)?

    private var isPrivateModeBinding: Binding<Bool> {
        Binding<Bool>(
            get: { viewModel.isPrivateMode },
            set: { newValue in
                if newValue {
                    BiometricAuthenticator.authenticate(reason: "Xác thực để truy cập các tab riêng tư.") { success in
                        if success {
                            viewModel.isPrivateMode = true
                        }
                    }
                } else {
                    viewModel.isPrivateMode = false
                }
            }
        )
    }

    public init(viewModel: BrowserViewModel, onDismiss: (() -> Void)? = nil) {
        self.viewModel = viewModel
        self.onDismiss = onDismiss
    }

    public var body: some View {
        VStack(spacing: 0) {
            header
            searchField
            tabGrid
        }
        .background(Color(UIColor.systemGroupedBackground).ignoresSafeArea())
        .safeAreaInset(edge: .bottom) {
            bottomBar
        }
        .navigationBarBackButtonHidden(true)
        .navigationBarHidden(true)
        .sheet(isPresented: $viewModel.showHistoryList) {
            BrowserHistoryView(viewModel: viewModel)
        }
    }

    private var header: some View {
        HStack(spacing: 12) {
            Menu {
                Button {
                    viewModel.showHistoryList = true
                } label: {
                    Label("Lịch sử", systemImage: "clock")
                }

                Picker("Sắp xếp các tab theo", selection: $sortMode) {
                    ForEach(BrowserTabSortMode.allCases) { mode in
                        Label(mode.title, systemImage: mode.systemImage).tag(mode)
                    }
                }

                Button {
                    copyVisibleLinks()
                } label: {
                    Label("Sao chép \(visibleTabs.count) liên kết", systemImage: "link")
                }

                Button {
                    bookmarkVisibleTabs()
                } label: {
                    Label("Thêm dấu trang cho \(visibleTabs.count) tab", systemImage: "book.badge.plus")
                }

                Divider()

                Button(role: .destructive) {
                    closeVisibleTabs()
                } label: {
                    Label("Đóng tất cả \(visibleTabs.count) tab", systemImage: "xmark")
                }
            } label: {
                Image(systemName: "ellipsis")
                    .font(.system(size: 17, weight: .semibold))
                    .frame(width: 38, height: 38)
                    .background(Circle().fill(Color(UIColor.secondarySystemFill)))
            }
            .accessibilityIdentifier("browser.tabSwitcher.moreMenu")

            Spacer()

            Text(viewModel.isPrivateMode ? "Riêng tư" : "Tất cả các tab")
                .font(.headline)
                .lineLimit(1)

            Spacer()

            Button {
                navigation.navigate(to: .browserSearch(isPrivate: viewModel.isPrivateMode))
            } label: {
                Image(systemName: "magnifyingglass")
                    .font(.system(size: 17, weight: .semibold))
                    .frame(width: 38, height: 38)
                    .background(Circle().fill(Color(UIColor.secondarySystemFill)))
            }
            .buttonStyle(.plain)
            .accessibilityIdentifier("browser.tabSwitcher.search")
        }
        .padding(.horizontal, 16)
        .padding(.top, 10)
        .padding(.bottom, 8)
    }

    private var searchField: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass")
                .foregroundStyle(.secondary)

            TextField("Tìm kiếm tab", text: $searchText)
                .textInputAutocapitalization(.never)
                .disableAutocorrection(true)

            if !searchText.isEmpty {
                Button {
                    searchText = ""
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(.secondary)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 12)
        .frame(height: 42)
        .background(
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .fill(Color(UIColor.secondarySystemGroupedBackground))
        )
        .padding(.horizontal, 16)
        .padding(.bottom, 10)
    }

    private var tabGrid: some View {
        ScrollView {
            if visibleTabs.isEmpty {
                emptyState
                    .frame(maxWidth: .infinity)
                    .padding(.top, 80)
            } else {
                LazyVGrid(columns: gridColumns, spacing: 14) {
                    ForEach(visibleTabs) { tab in
                        BrowserTabSwitcherCard(
                            tab: tab,
                            isActive: tab.id == viewModel.activeTabId,
                            onSelect: { select(tab) },
                            onClose: { close(tab) },
                            onCopyLink: { copyLink(for: tab) },
                            onDuplicate: { viewModel.duplicateTab(tab) },
                            onBookmark: { bookmark(tab) },
                            onCloseOthers: { closeOthers(keeping: tab) }
                        )
                    }
                }
                .padding(.horizontal, 14)
                .padding(.bottom, 96)
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: viewModel.isPrivateMode ? "hand.raised.fill" : "safari")
                .font(.system(size: 38))
                .foregroundStyle(.secondary)

            Text(viewModel.isPrivateMode ? "Chưa có tab riêng tư" : "Chưa có tab")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.secondary)
        }
    }

    private var bottomBar: some View {
        HStack(spacing: 16) {
            UniButton(
                style: .glass,
                action: {
                    navigation.createNewTabFromSwitcher(isPrivate: viewModel.isPrivateMode)
                    dismissSwitcher()
                },
                label: {
                    Image(systemName: "plus")
                        .font(.system(size: 15, weight: .semibold))
                }
            )
            .accessibilityIdentifier("browser.tabSwitcher.newTab")

            Picker("Chế độ tab", selection: isPrivateModeBinding) {
                Text("Riêng tư").tag(true)
                Text(normalTabCountTitle).tag(false)
            }
            .pickerStyle(.segmented)
            .frame(maxWidth: .infinity)
            .accessibilityIdentifier("browser.tabSwitcher.modePicker")

            UniButton(
                style: .glass,
                action: { dismissSwitcher() },
                label: {
                    Image(systemName: "checkmark")
                        .font(.system(size: 15, weight: .bold))
                }
            )
            .accessibilityIdentifier("browser.tabSwitcher.done")
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 20)
    }

    private var gridColumns: [GridItem] {
        [
            GridItem(.flexible(), spacing: 12),
            GridItem(.flexible(), spacing: 12)
        ]
    }

    private var visibleTabs: [BrowserTabViewModel] {
        var tabs = viewModel.tabs.filter { $0.isPrivate == viewModel.isPrivateMode }

        let query = searchText.trimmingCharacters(in: .whitespacesAndNewlines)
        if !query.isEmpty {
            tabs = tabs.filter { tab in
                tab.title.localizedCaseInsensitiveContains(query)
                    || (tab.currentURL?.absoluteString.localizedCaseInsensitiveContains(query) ?? false)
                    || (tab.currentURL?.host?.localizedCaseInsensitiveContains(query) ?? false)
            }
        }

        switch sortMode {
        case .currentOrder:
            return tabs
        case .title:
            return tabs.sorted { $0.title.localizedCaseInsensitiveCompare($1.title) == .orderedAscending }
        case .website:
            return tabs.sorted {
                ($0.currentURL?.host ?? "").localizedCaseInsensitiveCompare($1.currentURL?.host ?? "") == .orderedAscending
            }
        }
    }

    private var normalTabCountTitle: String {
        "\(viewModel.tabs.filter { !$0.isPrivate }.count) tab"
    }

    private func select(_ tab: BrowserTabViewModel) {
        viewModel.switchTab(to: tab.id)
        dismissSwitcher()
    }

    private func dismissSwitcher() {
        if let onDismiss {
            onDismiss()
        } else {
            navigation.closeTabSwitcher()
        }
    }

    private func close(_ tab: BrowserTabViewModel) {
        withAnimation(.easeInOut(duration: 0.18)) {
            viewModel.closeTab(id: tab.id)
        }
    }

    private func closeOthers(keeping tab: BrowserTabViewModel) {
        withAnimation(.easeInOut(duration: 0.18)) {
            viewModel.closeOtherTabs(keepingId: tab.id)
        }
    }

    private func closeVisibleTabs() {
        withAnimation(.easeInOut(duration: 0.18)) {
            viewModel.closeAllTabs(isPrivate: viewModel.isPrivateMode)
        }
    }

    private func copyVisibleLinks() {
        UIPasteboard.general.string = visibleTabs
            .compactMap { $0.currentURL?.absoluteString }
            .joined(separator: "\n")
    }

    private func copyLink(for tab: BrowserTabViewModel) {
        UIPasteboard.general.string = tab.currentURL?.absoluteString ?? ""
    }

    private func bookmarkVisibleTabs() {
        visibleTabs.forEach(bookmark)
    }

    private func bookmark(_ tab: BrowserTabViewModel) {
        guard let url = tab.currentURL?.absoluteString else { return }
        viewModel.persistenceStore.addBookmark(url: url, title: tab.title)
    }
}

private enum BrowserTabSortMode: String, CaseIterable, Identifiable {
    case currentOrder
    case title
    case website

    var id: String { rawValue }

    var title: String {
        switch self {
        case .currentOrder: return "Thứ tự hiện tại"
        case .title: return "Tiêu đề"
        case .website: return "Trang web"
        }
    }

    var systemImage: String {
        switch self {
        case .currentOrder: return "rectangle.grid.2x2"
        case .title: return "textformat"
        case .website: return "globe"
        }
    }
}

private struct BrowserTabSwitcherCard: View {
    @ObservedObject var tab: BrowserTabViewModel
    let isActive: Bool
    let onSelect: () -> Void
    let onClose: () -> Void
    let onCopyLink: () -> Void
    let onDuplicate: () -> Void
    let onBookmark: () -> Void
    let onCloseOthers: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            preview
                .frame(height: 150)

            HStack(spacing: 8) {
                Image(systemName: tab.isPrivate ? "hand.raised.fill" : "safari")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(tab.isPrivate ? .purple : .blue)
                    .frame(width: 18, height: 18)

                Text(tab.title)
                    .font(.caption.weight(isActive ? .semibold : .regular))
                    .lineLimit(1)

                Spacer(minLength: 0)

                Menu {
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
                } label: {
                    Image(systemName: "ellipsis")
                        .font(.system(size: 13, weight: .semibold))
                        .frame(width: 28, height: 28)
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 7)
            .background(Color(UIColor.systemBackground))
        }
        .background(Color(UIColor.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .stroke(isActive ? Color.accentColor : Color(UIColor.separator), lineWidth: isActive ? 2 : 0.5)
        )
        .contentShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
        .onTapGesture(perform: onSelect)
        .accessibilityElement(children: .combine)
        .accessibilityLabel(accessibilityTitle)
    }

    private var preview: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .fill(previewBackground)

            if let snapshot = tab.snapshot {
                Image(uiImage: snapshot)
                    .resizable()
                    .scaledToFill()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))

                VStack {
                    Spacer()
                    HStack {
                        Text(hostTitle)
                            .font(.caption2.weight(.semibold))
                            .lineLimit(1)
                            .foregroundStyle(.white)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 5)
                            .background(.black.opacity(0.45), in: Capsule())
                        Spacer(minLength: 0)
                    }
                    .padding(8)
                }
            } else {
                VStack(spacing: 10) {
                    Image(systemName: tab.isPrivate ? "hand.raised.fill" : "globe")
                        .font(.system(size: 30, weight: .medium))
                        .foregroundStyle(.secondary)

                    Text(hostTitle)
                        .font(.caption.weight(.medium))
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                        .padding(.horizontal, 10)
                }
            }
        }
        .padding(8)
    }

    private var previewBackground: Color {
        tab.isPrivate ? Color.purple.opacity(0.10) : Color(UIColor.secondarySystemGroupedBackground)
    }

    private var hostTitle: String {
        tab.currentURL?.host ?? "Trang bắt đầu"
    }

    private var accessibilityTitle: String {
        "\(tab.title), \(hostTitle)"
    }
}
