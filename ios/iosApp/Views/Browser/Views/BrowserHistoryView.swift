import ExploreSwiftUI
import SwiftUI

public struct BrowserHistoryView: View {
    @ObservedObject var viewModel: BrowserViewModel
    @Environment(\.dismiss) private var dismiss
    
    public init(viewModel: BrowserViewModel) {
        self.viewModel = viewModel
    }
    
    public var body: some View {
        NavigationView {
            List {
                if viewModel.persistenceStore.history.isEmpty {
                    VStack {
                        Spacer()
                        Image(systemName: "clock.badge.exclamationmark")
                            .font(.largeTitle)
                            .foregroundColor(.gray)
                        Text("Lịch sử trống")
                            .font(.headline)
                            .foregroundColor(.gray)
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
                                    .foregroundColor(.primary)
                                Text(item.url)
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                        .uniButtonStyle(.plain)
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
                                .foregroundColor(.red)
                        }
                        .uniButtonStyle(.plain)
                    }
                }
            }
        }
    }
}
