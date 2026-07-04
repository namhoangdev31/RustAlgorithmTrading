import ExploreSwiftUI
import SwiftUI

public struct BrowserHistoryView: View {
    @ObservedObject var viewModel: BrowserViewModel
    @Environment(\.dismiss) private var dismiss
    
    public init(viewModel: BrowserViewModel) {
        self.viewModel = viewModel
    }
    
    public var body: some View {
        UniNavigationStack {
            UniList {
                if viewModel.persistenceStore.history.isEmpty {
                    VStack {
                        Spacer()
                        Image(systemName: "clock.badge.exclamationmark")
                            .font(.largeTitle)
                            .uniForegroundStyle(.gray)
                        Text("Lịch sử trống")
                            .font(.headline)
                            .uniForegroundStyle(.gray)
                        Spacer()
                    }
                    .frame(maxWidth: .infinity, minHeight: 200)
                } else {
                    ForEach(viewModel.persistenceStore.history) { item in
                        UniButton(action: {
                            viewModel.loadURLString(item.url)
                            dismiss()
                        }) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(item.title)
                                    .font(.headline)
                                    .uniForegroundStyle(.primary)
                                Text(item.url)
                                    .font(.caption)
                                    .uniForegroundStyle(.secondary)
                            }
                        }
                        .uniButtonStyle(.plain)
                    }
                    .onDelete { indexSet in
                        for index in indexSet {
                            let item = viewModel.persistenceStore.history[index]
                            viewModel.persistenceStore.removeHistoryItem(id: item.id)
                        }
                    }
                }
            }
            .navigationTitle("Lịch sử duyệt web")
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
                    if !viewModel.persistenceStore.history.isEmpty {
                        UniButton(action: {
                            viewModel.persistenceStore.clearHistory()
                        }) {
                            Text("Xóa tất cả")
                                .uniForegroundStyle(.red)
                        }
                        .uniButtonStyle(.plain)
                    }
                }
            }
        }
    }
}
