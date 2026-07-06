import ExploreSwiftUI
import SwiftUI

// MARK: - Safari-style Start Page

public struct BrowserStartPageView: View {
    @ObservedObject var viewModel: BrowserViewModel
    let onNavigate: (BrowserRoute) -> Void
    @Environment(\.colorScheme) private var colorScheme

    @State private var showAddAlert = false
    @State private var newTitle = ""
    @State private var newURL = ""
    
    @State private var itemToEdit: BrowserFavorite?
    @State private var editTitle = ""
    @State private var editURL = ""
    
    @State private var itemToDelete: BrowserFavorite?
    @State private var showDeleteConfirmation = false

    public init(viewModel: BrowserViewModel, onNavigate: @escaping (BrowserRoute) -> Void) {
        self.viewModel = viewModel
        self.onNavigate = onNavigate
    }

    public var body: some View {
        ZStack {
            startPageBackground
                .ignoresSafeArea()

            UniScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    // MARK: Search Bar
                    searchBarPill
                        .padding(.top, 8)

                    // MARK: Open Tabs
                    if hasOpenTabs {
                        openTabsSection
                    }

                    // MARK: Mục Ưa Thích
                    favoritesSection

                    // MARK: Vừa Xem
                    if !viewModel.persistenceStore.recentlyViewed.isEmpty {
                        recentlyViewedSection
                    }

                    // MARK: Thường Xuyên
                    if !viewModel.persistenceStore.frequentlyVisited.isEmpty {
                        frequentlyVisitedSection
                    }

                    // MARK: Bookmark
                    if !viewModel.persistenceStore.bookmarks.isEmpty {
                        bookmarksSection
                    }

                    Spacer(minLength: 80)
                }.padding(.horizontal, 20)
            }
            .uniBackgroundExtension()
        }
        .navigationBarHidden(true)
        .alert("Thêm mục ưa thích", isPresented: $showAddAlert) {
            TextField("Tiêu đề", text: $newTitle)
            TextField("Địa chỉ (URL)", text: $newURL)
                .autocapitalization(.none)
                .keyboardType(.URL)
            Button("Thêm", action: addNewFavorite)
            Button("Hủy", role: .cancel) {
                newTitle = ""
                newURL = ""
            }
        }
        .alert("Sửa mục ưa thích", isPresented: Binding(
            get: { itemToEdit != nil },
            set: { if !$0 { itemToEdit = nil } }
        )) {
            TextField("Tiêu đề", text: $editTitle)
            TextField("Địa chỉ (URL)", text: $editURL)
                .autocapitalization(.none)
                .keyboardType(.URL)
            Button("Lưu") {
                if let item = itemToEdit {
                    var targetURLString = editURL.trimmingCharacters(in: .whitespacesAndNewlines)
                    if !targetURLString.lowercased().hasPrefix("http://") && !targetURLString.lowercased().hasPrefix("https://") {
                        targetURLString = "https://" + targetURLString
                    }
                    viewModel.persistenceStore.updateFavorite(id: item.id, title: editTitle, url: targetURLString)
                }
                itemToEdit = nil
            }
            Button("Hủy", role: .cancel) {
                itemToEdit = nil
            }
        }
        .alert("Xóa mục ưa thích", isPresented: $showDeleteConfirmation) {
            Button("Xóa", role: .destructive) {
                if let item = itemToDelete {
                    viewModel.persistenceStore.deleteFavorite(id: item.id)
                }
                itemToDelete = nil
            }
            Button("Hủy", role: .cancel) {
                itemToDelete = nil
            }
        } message: {
            if let item = itemToDelete {
                Text("Bạn có chắc chắn muốn xóa \"\(item.title)\" khỏi mục ưa thích?")
            }
        }
    }

    // MARK: - Background

    @ViewBuilder
    private var startPageBackground: some View {
        if colorScheme == .dark {
            LinearGradient(
                colors: [
                    Color(hue: 0.57, saturation: 0.3, brightness: 0.18),
                    Color(hue: 0.6, saturation: 0.25, brightness: 0.12),
                    Color(hue: 0.0, saturation: 0.0, brightness: 0.08),
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        } else {
            LinearGradient(
                colors: [
                    Color(hue: 0.56, saturation: 0.15, brightness: 0.97),
                    Color(hue: 0.52, saturation: 0.10, brightness: 0.94),
                    Color(UIColor.systemGroupedBackground),
                ],
                startPoint: .top,
                endPoint: .bottom
            )
        }
    }

    // MARK: - Search Bar Pill

    private var searchBarPill: some View {
        UniButton(action: { onNavigate(.search) }) {
            HStack(spacing: 10) {
                Image(systemName: "magnifyingglass")
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(.secondary)

                Text("Tìm hoặc nhập tên web")
                    .font(.system(size: 16))
                    .foregroundColor(.secondary)

                Spacer()
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(
                Capsule()
                    .fill(colorScheme == .dark
                        ? Color(UIColor.secondarySystemGroupedBackground)
                        : Color.white.opacity(0.82))
                    .shadow(color: .black.opacity(0.06), radius: 6, x: 0, y: 2)
            )
        }
        .uniButtonStyle(.plain)
    }

    // MARK: - Mục Ưa Thích

    private var favoritesSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            sectionHeader("Mục ưa thích", icon: "star.fill")

            LazyVGrid(
                columns: Array(repeating: GridItem(.flexible(), spacing: 18), count: 4),
                spacing: 20
            ) {
                let list = Array(viewModel.persistenceStore.favorites.prefix(4))
                ForEach(list) { item in
                    FavoriteTileView(item: item) {
                        onNavigate(.url(item.url))
                    }
                    .contextMenu {
                        Button {
                            editTitle = item.title
                            editURL = item.url
                            itemToEdit = item
                        } label: {
                            Label("Sửa", systemImage: "pencil")
                        }
                        
                        Button(role: .destructive) {
                            itemToDelete = item
                            showDeleteConfirmation = true
                        } label: {
                            Label("Xóa", systemImage: "trash")
                        }
                    }
                }
                
                if list.count < 4 {
                    Button {
                        newTitle = ""
                        newURL = ""
                        showAddAlert = true
                    } label: {
                        VStack(spacing: 9) {
                            ZStack {
                                Circle()
                                    .fill(Color(UIColor.systemFill))
                                    .frame(width: 60, height: 60)
                                Image(systemName: "plus")
                                    .font(.system(size: 22, weight: .medium))
                                    .foregroundColor(.secondary)
                            }
                            Text("Thêm")
                                .font(.system(size: 11))
                                .foregroundColor(.secondary)
                        }
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    // MARK: - Vừa Xem

    private var recentlyViewedSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            sectionHeader("Vừa xem", icon: "clock.fill")

            VStack(spacing: 0) {
                let items = viewModel.persistenceStore.recentlyViewed
                ForEach(Array(items.enumerated()), id: \.element.id) { index, item in
                    HistoryRow(item: item) {
                        onNavigate(.url(item.url))
                    }
                    if index < items.count - 1 {
                        Divider().padding(.leading, 64)
                    }
                }
            }
            .background(sectionCardBackground)
        }
    }

    // MARK: - Thường Xuyên

    private var frequentlyVisitedSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            sectionHeader("Thường xuyên", icon: "flame.fill")

            LazyVGrid(
                columns: Array(repeating: GridItem(.flexible(), spacing: 18), count: 4),
                spacing: 20
            ) {
                ForEach(viewModel.persistenceStore.frequentlyVisited) { site in
                    FrequentSiteTile(site: site) {
                        onNavigate(.url(site.url))
                    }
                }
            }
        }
    }

    // MARK: - Bookmark

    private var bookmarksSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            sectionHeader("Bookmark", icon: "bookmark.fill")

            VStack(spacing: 0) {
                let items = viewModel.persistenceStore.bookmarks.prefix(5)
                ForEach(Array(items.enumerated()), id: \.element.id) { index, bookmark in
                    BookmarkRow(bookmark: bookmark) {
                        onNavigate(.url(bookmark.url))
                    }
                    if index < items.count - 1 {
                        Divider().padding(.leading, 64)
                    }
                }
            }
            .background(sectionCardBackground)

            if viewModel.persistenceStore.bookmarks.count > 5 {
                UniButton(action: { viewModel.showBookmarksList = true }) {
                    Text("Xem tất cả")
                        .font(.subheadline.weight(.medium))
                        .foregroundColor(.blue)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(
                            RoundedRectangle(cornerRadius: 10, style: .continuous)
                                .fill(colorScheme == .dark
                                    ? Color(UIColor.secondarySystemGroupedBackground)
                                    : Color.white.opacity(0.72))
                        )
                }
                .uniButtonStyle(.plain)
            }
        }
    }

    // MARK: - Shared Helpers

    private func sectionHeader(_ title: String, icon: String) -> some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 13))
                .foregroundColor(.secondary)
            Text(title)
                .font(.title3.weight(.semibold))
                .foregroundColor(.primary)
        }
    }

    private var sectionCardBackground: some View {
        RoundedRectangle(cornerRadius: 14, style: .continuous)
            .fill(colorScheme == .dark
                ? Color(UIColor.secondarySystemGroupedBackground)
                : Color.white.opacity(0.72))
            .shadow(color: .black.opacity(0.06), radius: 8, x: 0, y: 2)
    }

    private var hasOpenTabs: Bool {
        viewModel.tabs.contains { !$0.isPrivate && $0.currentURL != nil }
    }

    private var openTabsSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                sectionHeader("Tab đang mở", icon: "square.on.square.fill")
                Spacer()
                UniButton(action: {
                    onNavigate(.tabSwitcher)
                }) {
                    Text("Quản lý")
                        .font(.subheadline.weight(.medium))
                        .foregroundColor(.blue)
                }
                .uniButtonStyle(.plain)
            }
            
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    let openTabsList = viewModel.tabs.filter { !$0.isPrivate && $0.currentURL != nil }
                    ForEach(openTabsList) { tab in
                        HStack(spacing: 10) {
                            let domain = tab.currentURL?.host ?? ""
                            FaviconView(
                                domain: domain,
                                size: 32,
                                initial: tab.title.isEmpty ? String(domain.prefix(1)) : String(tab.title.prefix(1)),
                                bgColor: Color.blue.opacity(0.15)
                            )
                            
                            VStack(alignment: .leading, spacing: 2) {
                                Text(tab.title.isEmpty ? domain : tab.title)
                                    .font(.subheadline.weight(.semibold))
                                    .foregroundColor(.primary)
                                    .lineLimit(1)
                                Text(domain)
                                    .font(.caption2)
                                    .foregroundColor(.secondary)
                                    .lineLimit(1)
                            }
                            .frame(width: 120, alignment: .leading)
                            
                            // Close Button
                            Button {
                                withAnimation {
                                    viewModel.closeTab(id: tab.id)
                                }
                            } label: {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundColor(.secondary)
                                    .font(.system(size: 16))
                            }
                            .buttonStyle(.plain)
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 10)
                        .background(
                            RoundedRectangle(cornerRadius: 12, style: .continuous)
                                .fill(colorScheme == .dark
                                    ? Color(UIColor.secondarySystemGroupedBackground)
                                    : Color.white.opacity(0.82))
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 12, style: .continuous)
                                .stroke(Color.primary.opacity(0.06), lineWidth: 0.5)
                        )
                        .contentShape(Rectangle())
                        .onTapGesture {
                            viewModel.switchTab(to: tab.id)
                            onNavigate(.url(tab.currentURL?.absoluteString ?? ""))
                        }
                    }
                }
                .padding(.horizontal, 2)
                .padding(.vertical, 4)
            }
        }
    }
    
    private func addNewFavorite() {
        let title = newTitle.trimmingCharacters(in: .whitespacesAndNewlines)
        let urlString = newURL.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !urlString.isEmpty else { return }
        
        var targetURLString = urlString
        if !targetURLString.lowercased().hasPrefix("http://") && !targetURLString.lowercased().hasPrefix("https://") {
            targetURLString = "https://" + targetURLString
        }
        
        viewModel.persistenceStore.addFavorite(
            title: title.isEmpty ? (URL(string: targetURLString)?.host ?? targetURLString) : title,
            url: targetURLString
        )
        newTitle = ""
        newURL = ""
    }
}

// MARK: - Favorite Tile

private struct FavoriteTileView: View {
    let item: BrowserFavorite
    let action: () -> Void
    @State private var isPressed = false

    private var tileColor: Color {
        let hash = abs(item.title.hashValue)
        let hue = Double(hash % 360) / 360.0
        return Color(hue: hue, saturation: 0.55, brightness: 0.78)
    }

    var body: some View {
        let domain = URL(string: item.url)?.host ?? ""
        let initial = item.title.isEmpty ? String(domain.prefix(1)) : String(item.title.prefix(1))
        
        UniButton(action: action) {
            VStack(spacing: 9) {
                FaviconView(
                    domain: domain,
                    size: 60,
                    initial: initial.uppercased(),
                    bgColor: tileColor
                )
                .scaleEffect(isPressed ? 0.92 : 1.0)
                .animation(.spring(response: 0.2, dampingFraction: 0.6), value: isPressed)

                Text(item.title)
                    .font(.system(size: 11))
                    .foregroundColor(.secondary)
                    .lineLimit(1)
            }
        }
        .uniButtonStyle(.plain)
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in isPressed = true }
                .onEnded { _ in isPressed = false }
        )
    }
}

// MARK: - Frequent Site Tile

private struct FrequentSiteTile: View {
    let site: FrequentSite
    let action: () -> Void
    @State private var isPressed = false

    private var tileColor: Color {
        let hash = abs(site.domain.hashValue)
        let hue = Double(hash % 360) / 360.0
        return Color(hue: hue, saturation: 0.55, brightness: 0.78)
    }

    var body: some View {
        UniButton(action: action) {
            VStack(spacing: 9) {
                FaviconView(
                    domain: site.domain,
                    size: 60,
                    initial: String(site.domain.prefix(1)),
                    bgColor: tileColor
                )
                .scaleEffect(isPressed ? 0.92 : 1.0)
                .animation(.spring(response: 0.2, dampingFraction: 0.6), value: isPressed)

                Text(site.domain)
                    .font(.system(size: 10))
                    .foregroundColor(.secondary)
                    .lineLimit(1)
            }
        }
        .uniButtonStyle(.plain)
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in isPressed = true }
                .onEnded { _ in isPressed = false }
        )
    }
}

// MARK: - History Row

private struct HistoryRow: View {
    let item: BrowserHistoryItem
    let action: () -> Void

    var body: some View {
        let domain = URL(string: item.url)?.host ?? ""
        UniButton(action: action) {
            HStack(spacing: 12) {
                FaviconView(
                    domain: domain,
                    size: 44,
                    initial: item.title.isEmpty ? String(domain.prefix(1)) : String(item.title.prefix(1)),
                    bgColor: Color.blue.opacity(0.8)
                )

                VStack(alignment: .leading, spacing: 3) {
                    Text(item.title.isEmpty ? item.url : item.title)
                        .font(.subheadline.weight(.medium))
                        .foregroundColor(.primary)
                        .lineLimit(1)
                    Text(URL(string: item.url)?.host ?? item.url)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }

                Spacer(minLength: 0)

                Image(systemName: "chevron.right")
                    .font(.caption2.weight(.semibold))
                    .foregroundColor(Color(UIColor.tertiaryLabel))
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .contentShape(Rectangle())
        }
        .uniButtonStyle(.plain)
    }
}

// MARK: - Bookmark Row

private struct BookmarkRow: View {
    let bookmark: BrowserBookmark
    let action: () -> Void

    var body: some View {
        let domain = URL(string: bookmark.url)?.host ?? ""
        UniButton(action: action) {
            HStack(spacing: 12) {
                FaviconView(
                    domain: domain,
                    size: 44,
                    initial: bookmark.title.isEmpty ? String(domain.prefix(1)) : String(bookmark.title.prefix(1)),
                    bgColor: Color.orange
                )

                VStack(alignment: .leading, spacing: 3) {
                    Text(bookmark.title.isEmpty ? bookmark.url : bookmark.title)
                        .font(.subheadline.weight(.medium))
                        .foregroundColor(.primary)
                        .lineLimit(2)
                    Text(URL(string: bookmark.url)?.host ?? bookmark.url)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }

                Spacer(minLength: 0)

                Image(systemName: "chevron.right")
                    .font(.caption2.weight(.semibold))
                    .foregroundColor(Color(UIColor.tertiaryLabel))
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .contentShape(Rectangle())
        }
        .uniButtonStyle(.plain)
    }
}

