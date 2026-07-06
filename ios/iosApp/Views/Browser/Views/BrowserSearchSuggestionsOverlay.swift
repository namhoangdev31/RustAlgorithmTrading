import SwiftUI

public struct BrowserSearchSuggestionsOverlay: View {
    @ObservedObject var viewModel: BrowserViewModel
    
    public init(viewModel: BrowserViewModel) {
        self.viewModel = viewModel
    }
    
    public var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                if viewModel.urlInputText.isEmpty {
                    recentSearchesSection
                } else {
                    suggestionsSection
                }
            }
            .padding(.top, 16)
        }
        .background(Color(UIColor.systemBackground))
    }
    
    private var recentSearchesSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("Tìm kiếm gần đây")
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(.secondary)
                
                Spacer()
                
                Button(action: {
                    viewModel.persistenceStore.clearSearchQueries()
                }) {
                    Text("Xóa tất cả")
                        .font(.subheadline)
                        .foregroundColor(.gray)
                }
            }
            .padding(.horizontal, 16)
            
            if viewModel.persistenceStore.searchQueries.isEmpty {
                Text("Không có tìm kiếm gần đây")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
            } else {
                VStack(spacing: 0) {
                    ForEach(viewModel.persistenceStore.searchQueries.prefix(10), id: \.self) { query in
                        HStack(spacing: 12) {
                            Image(systemName: "magnifyingglass")
                                .foregroundColor(.secondary)
                            
                            HStack {
                                Text(query)
                                    .foregroundColor(.primary)
                                    .lineLimit(1)
                                Spacer()
                            }
                            .contentShape(Rectangle())
                            .onTapGesture {
                                viewModel.submitSearch(query)
                            }
                            
                            Button(action: {
                                viewModel.urlInputText = query
                            }) {
                                Image(systemName: "arrow.up.left")
                                    .foregroundColor(.secondary)
                                    .padding(.leading, 8)
                            }
                            .buttonStyle(PlainButtonStyle())
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                        
                        Divider().padding(.leading, 40)
                    }
                }
            }
        }
    }
    
    private var suggestionsSection: some View {
        VStack(alignment: .leading, spacing: 15) {
            // Google Search suggestions
            let matchedQueries = viewModel.googleSuggestions
            
            if !matchedQueries.isEmpty {
                VStack(alignment: .leading, spacing: 0) {
                    Text("Gợi ý từ Google")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .padding(.horizontal, 16)
                        .padding(.bottom, 6)
                    
                    ForEach(matchedQueries, id: \.self) { query in
                        HStack(spacing: 12) {
                            Image(systemName: "magnifyingglass")
                                .foregroundColor(.secondary)
                            
                            HStack {
                                Text(query)
                                    .foregroundColor(.primary)
                                    .lineLimit(1)
                                Spacer()
                            }
                            .contentShape(Rectangle())
                            .onTapGesture {
                                viewModel.submitSearch(query)
                            }
                            
                            Button(action: {
                                viewModel.urlInputText = query
                            }) {
                                Image(systemName: "arrow.up.left")
                                    .foregroundColor(.secondary)
                                    .padding(.leading, 8)
                            }
                            .buttonStyle(PlainButtonStyle())
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 10)
                        Divider().padding(.leading, 40)
                    }
                }
            }
            
            // History Page suggestions
            let matchedHistory = viewModel.persistenceStore.history.filter {
                $0.title.localizedCaseInsensitiveContains(viewModel.urlInputText) ||
                $0.url.localizedCaseInsensitiveContains(viewModel.urlInputText)
            }
            
            if !matchedHistory.isEmpty {
                VStack(alignment: .leading, spacing: 0) {
                    Text("Lịch sử truy cập")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .padding(.horizontal, 16)
                        .padding(.bottom, 6)
                    
                    ForEach(matchedHistory.prefix(15)) { item in
                        Button(action: {
                            viewModel.submitSearch(item.url)
                        }) {
                            HStack(spacing: 12) {
                                FaviconView(domain: URL(string: item.url)?.host ?? "", size: 24, initial: String(item.title.prefix(1)))
                                
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(item.title)
                                        .font(.subheadline)
                                        .foregroundColor(.primary)
                                        .lineLimit(1)
                                    Text(item.url)
                                        .font(.caption2)
                                        .foregroundColor(.secondary)
                                        .lineLimit(1)
                                }
                                Spacer()
                            }
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                        }
                        Divider().padding(.leading, 48)
                    }
                }
            }
        }
    }
}
