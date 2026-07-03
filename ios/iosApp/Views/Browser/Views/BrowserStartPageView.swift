import ExploreSwiftUI
import SwiftUI

// MARK: - Safari-style Start Page

public struct BrowserStartPageView: View {
    @ObservedObject var viewModel: BrowserViewModel
    let onNavigate: (BrowserRoute) -> Void
    @Environment(\.colorScheme) private var colorScheme

    private let favorites: [FavoriteItem] = [
        FavoriteItem(title: "Apple", url: "https://apple.com", initial: "🍎", bgColor: Color(UIColor.systemFill)),
        FavoriteItem(title: "Bing", url: "https://bing.com", initial: "B", bgColor: Color(hue: 0.58, saturation: 0.82, brightness: 0.92)),
        FavoriteItem(title: "Google", url: "https://google.com", initial: "G", bgColor: Color(hue: 0.0, saturation: 0.0, brightness: 0.98)),
        FavoriteItem(title: "Yahoo!", url: "https://yahoo.com", initial: "Y!", bgColor: Color(hue: 0.77, saturation: 0.75, brightness: 0.72)),
    ]

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
                }
                .padding(.horizontal, 20)
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
                ForEach(favorites) { item in
                    FavoriteTileView(item: item) {
                        if let url = item.url {
                            onNavigate(.url(url))
                        }
                    }
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
}

// MARK: - Favorite Tile

private struct FavoriteTileView: View {
    let item: FavoriteItem
    let action: () -> Void
    @State private var isPressed = false

    var body: some View {
        UniButton(action: action) {
            VStack(spacing: 9) {
                ZStack {
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .fill(item.bgColor)
                        .frame(width: 60, height: 60)
                        .shadow(color: .black.opacity(0.12), radius: 5, x: 0, y: 3)

                    Text(item.initial)
                        .font(.system(size: item.initial.count > 1 ? 18 : 24, weight: .bold))
                        .foregroundColor(item.iconColor)
                }
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
                ZStack {
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .fill(tileColor)
                        .frame(width: 60, height: 60)
                        .shadow(color: .black.opacity(0.12), radius: 5, x: 0, y: 3)

                    Text(String(site.domain.prefix(1)).uppercased())
                        .font(.system(size: 24, weight: .bold))
                        .foregroundColor(.white)
                }
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
        UniButton(action: action) {
            HStack(spacing: 12) {
                ZStack {
                    RoundedRectangle(cornerRadius: 8, style: .continuous)
                        .fill(Color.blue.opacity(0.15))
                        .frame(width: 44, height: 44)
                    Image(systemName: "clock.fill")
                        .font(.system(size: 16))
                        .foregroundColor(.blue)
                }

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
        UniButton(action: action) {
            HStack(spacing: 12) {
                ZStack {
                    RoundedRectangle(cornerRadius: 8, style: .continuous)
                        .fill(
                            LinearGradient(
                                colors: [Color.orange, Color.red],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 44, height: 44)
                    Text(String(bookmark.title.prefix(1)).uppercased())
                        .font(.system(size: 18, weight: .bold))
                        .foregroundColor(.white)
                }

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

// MARK: - Data Models

private struct FavoriteItem: Identifiable {
    let id = UUID()
    let title: String
    let url: String?
    let initial: String
    let bgColor: Color
    var iconColor: Color = .white
}
