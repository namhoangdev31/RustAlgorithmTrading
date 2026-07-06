import ExploreSwiftUI
import SwiftUI

public struct BrowserBookmarksView: View {
    @ObservedObject var viewModel: BrowserViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var selectedTab: Int
    @State private var searchText = ""
    
    public init(viewModel: BrowserViewModel, initialTab: Int = 0) {
        self.viewModel = viewModel
        self._selectedTab = State(initialValue: initialTab)
    }
    
    public var body: some View {
        UniNavigationStack {
            List {
                switch selectedTab {
                case 0:
                    bookmarksTabContent
                case 1:
                    readingListTabContent
                case 2:
                    historyTabContent
                default:
                    EmptyView()
                }
            }
            .listStyle(.insetGrouped)
            .searchable(text: $searchText, placement: .navigationBarDrawer(displayMode: .always), prompt: "Tìm kiếm")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Picker("", selection: $selectedTab) {
                        Image(systemName: "book").tag(0)
                        Image(systemName: "eyeglasses").tag(1)
                        Image(systemName: "clock").tag(2)
                    }
                    .pickerStyle(.segmented)
                    .frame(width: 180)
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    UniButton(action: { dismiss() }) {
                        Text("Xong")
                            .bold()
                    }
                    .uniButtonStyle(.plain)
                }
            }
        }
    }
    
    private var recentlySavedSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Đã lưu gần đây")
                .font(.subheadline.weight(.bold))
                .foregroundColor(.primary)
                .padding(.horizontal, 16)
            
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(viewModel.persistenceStore.bookmarks.prefix(4)) { bookmark in
                        UniButton(action: {
                            viewModel.loadURLString(bookmark.url)
                            dismiss()
                        }) {
                            VStack(alignment: .center, spacing: 4) {
                                ZStack {
                                    RoundedRectangle(cornerRadius: 12)
                                        .fill(Color(UIColor.secondarySystemGroupedBackground))
                                        .frame(width: 80, height: 80)
                                        .shadow(color: .black.opacity(0.04), radius: 2)
                                    
                                    FaviconView(domain: URL(string: bookmark.url)?.host ?? "", size: 36, initial: String(bookmark.title.prefix(1)))
                                }
                                
                                Text(bookmark.title)
                                    .font(.caption2.weight(.medium))
                                    .foregroundColor(.primary)
                                    .lineLimit(1)
                                    .frame(width: 80)
                                
                                Text(URL(string: bookmark.url)?.host ?? "")
                                    .font(.system(size: 8))
                                    .foregroundColor(.secondary)
                                    .lineLimit(1)
                                    .frame(width: 80)
                            }
                        }
                        .uniButtonStyle(.plain)
                    }
                }
                .padding(.horizontal, 16)
            }
        }
        .padding(.vertical, 8)
    }
    
    @ViewBuilder
    private var bookmarksTabContent: some View {
        // Section 1: Recently saved horizontal scroll view
        if !viewModel.persistenceStore.bookmarks.isEmpty {
            Section {
                recentlySavedSection
            }
            .listRowInsets(EdgeInsets())
            .listRowBackground(Color.clear)
        }
        
        // Section 2: Folders
        Section(header: Text("Thư mục")) {
            folderRow(title: "Mục ưa thích", icon: "star.fill", color: .blue, count: viewModel.persistenceStore.bookmarks.count)
            folderRow(title: "Nhóm tab ưa thích", icon: "folder.fill.badge.person.crop", color: .blue, count: nil)
        }
        
        // Section 3: Bookmarks List
        Section(header: Text("Dấu trang")) {
            if viewModel.persistenceStore.bookmarks.isEmpty {
                Text("Không có dấu trang")
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
            } else {
                let filteredBookmarks = viewModel.persistenceStore.bookmarks.filter {
                    searchText.isEmpty ? true : $0.title.localizedCaseInsensitiveContains(searchText) || $0.url.localizedCaseInsensitiveContains(searchText)
                }
                
                ForEach(filteredBookmarks) { bookmark in
                    UniButton(action: {
                        viewModel.loadURLString(bookmark.url)
                        dismiss()
                    }) {
                        HStack(spacing: 12) {
                            FaviconView(domain: URL(string: bookmark.url)?.host ?? "", size: 24, initial: String(bookmark.title.prefix(1)))
                            
                            VStack(alignment: .leading, spacing: 2) {
                                Text(bookmark.title)
                                    .font(.subheadline.weight(.semibold))
                                    .foregroundColor(.primary)
                                    .lineLimit(1)
                                Text(bookmark.url)
                                    .font(.caption2)
                                    .foregroundColor(.secondary)
                                    .lineLimit(1)
                            }
                        }
                    }
                    .uniButtonStyle(.plain)
                    .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                        Button(role: .destructive) {
                            viewModel.persistenceStore.removeBookmark(id: bookmark.id)
                        } label: {
                            Label("Xóa", systemImage: "trash")
                        }
                    }
                }
            }
        }
    }
    
    @ViewBuilder
    private var readingListTabContent: some View {
        // Section 1: Recently saved horizontal scroll view
        if !viewModel.persistenceStore.readingList.isEmpty {
            Section {
                recentlySavedSection
            }
            .listRowInsets(EdgeInsets())
            .listRowBackground(Color.clear)
        }

        Section(header: Text("Danh sách đọc")) {
            if viewModel.persistenceStore.readingList.isEmpty {
                Text("Không có danh sách đọc")
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
            } else {
                let filteredReadingList = viewModel.persistenceStore.readingList.filter {
                    searchText.isEmpty ? true : $0.title.localizedCaseInsensitiveContains(searchText) || $0.url.localizedCaseInsensitiveContains(searchText)
                }
                
                ForEach(filteredReadingList) { item in
                    UniButton(action: {
                        viewModel.loadURLString(item.url)
                        dismiss()
                    }) {
                        HStack(spacing: 12) {
                            FaviconView(domain: item.domain, size: 40, initial: String(item.title.prefix(1)))
                            
                            VStack(alignment: .leading, spacing: 4) {
                                Text(item.title)
                                    .font(.subheadline.weight(.semibold))
                                    .foregroundColor(.primary)
                                    .lineLimit(1)
                                Text(item.domain)
                                    .font(.caption2)
                                    .foregroundColor(.secondary)
                                Text(item.previewText)
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                    .lineLimit(2)
                            }
                        }
                    }
                    .uniButtonStyle(.plain)
                    .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                        Button(role: .destructive) {
                            viewModel.persistenceStore.removeReadingListItem(id: item.id)
                        } label: {
                            Label("Xóa", systemImage: "trash")
                        }
                    }
                }
            }
        }
    }
    
    @ViewBuilder
    private var historyTabContent: some View {
        Section(header: Text("Sáng nay")) {
            if viewModel.persistenceStore.history.isEmpty {
                Text("Không có lịch sử")
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
            } else {
                let filteredHistory = viewModel.persistenceStore.history.filter {
                    searchText.isEmpty ? true : $0.title.localizedCaseInsensitiveContains(searchText) || $0.url.localizedCaseInsensitiveContains(searchText)
                }
                
                ForEach(filteredHistory) { item in
                    UniButton(action: {
                        viewModel.loadURLString(item.url)
                        dismiss()
                    }) {
                        HStack(spacing: 12) {
                            FaviconView(domain: URL(string: item.url)?.host ?? "", size: 24, initial: String(item.title.prefix(1)))
                            
                            VStack(alignment: .leading, spacing: 2) {
                                Text(item.title)
                                    .font(.subheadline.weight(.semibold))
                                    .foregroundColor(.primary)
                                    .lineLimit(1)
                                Text(URL(string: item.url)?.host ?? "")
                                    .font(.caption2)
                                    .foregroundColor(.secondary)
                                    .lineLimit(1)
                            }
                        }
                    }
                    .uniButtonStyle(.plain)
                    .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                        Button(role: .destructive) {
                            viewModel.persistenceStore.removeHistoryItem(id: item.id)
                        } label: {
                            Label("Xóa", systemImage: "trash")
                        }
                    }
                }
            }
        }
    }
    
    private func folderRow(title: String, icon: String, color: Color, count: Int?) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 14))
                .foregroundColor(.white)
                .frame(width: 28, height: 28)
                .background(RoundedRectangle(cornerRadius: 6).fill(color))
            
            Text(title)
                .foregroundColor(.primary)
            
            Spacer()
            
            if let count = count {
                Text("\(count)")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            
            Image(systemName: "chevron.right")
                .font(.system(size: 12, weight: .bold))
                .foregroundColor(Color(UIColor.tertiaryLabel))
        }
    }
}
