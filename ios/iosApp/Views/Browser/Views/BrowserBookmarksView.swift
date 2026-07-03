import ExploreSwiftUI
import SwiftUI

public struct BrowserBookmarksView: View {
    @ObservedObject var viewModel: BrowserViewModel
    @Environment(\.dismiss) private var dismiss
    
    public init(viewModel: BrowserViewModel) {
        self.viewModel = viewModel
    }
    
    public var body: some View {
        NavigationView {
            List {
                if viewModel.persistenceStore.bookmarks.isEmpty {
                    VStack {
                        Spacer()
                        Image(systemName: "bookmark.slash")
                            .font(.largeTitle)
                            .foregroundColor(.gray)
                        Text("Không có dấu trang")
                            .font(.headline)
                            .foregroundColor(.gray)
                        Spacer()
                    }
                    .frame(maxWidth: .infinity, minHeight: 200)
                } else {
                    ForEach(viewModel.persistenceStore.bookmarks) { bookmark in
                        UniButton(action: {
                            viewModel.loadURLString(bookmark.url)
                            dismiss()
                        }) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(bookmark.title)
                                    .font(.headline)
                                    .foregroundColor(.primary)
                                Text(bookmark.url)
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                        .uniButtonStyle(.plain)
                    }
                    .onDelete { indexSet in
                        for index in indexSet {
                            let item = viewModel.persistenceStore.bookmarks[index]
                            viewModel.persistenceStore.removeBookmark(id: item.id)
                        }
                    }
                }
            }
            .navigationTitle("Dấu trang")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    UniButton(action: {
                        dismiss()
                    }) {
                        Text("Xong")
                    }
                    .uniButtonStyle(.plain)
                }
                ToolbarItem(placement: .navigationBarLeading) {
                    if !viewModel.persistenceStore.bookmarks.isEmpty {
                        UniButton(action: {
                            viewModel.persistenceStore.clearBookmarks()
                        }) {
                            Text("Xóa tất cả")
                                .foregroundColor(.red)
                        }
                        .uniButtonStyle(.plain)
                    }
                }
            }
        }
    }
}
