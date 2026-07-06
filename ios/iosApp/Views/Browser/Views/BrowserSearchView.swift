import SwiftUI
import ExploreSwiftUI

public struct BrowserSearchView: View {
    @ObservedObject var viewModel: BrowserViewModel
    @EnvironmentObject var navigation: NavigationViewModel
    
    @State private var inputText: String = ""
    
    public init(viewModel: BrowserViewModel) {
        self.viewModel = viewModel
    }
    
    public var body: some View {
        ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    if inputText.isEmpty {
                        // 1. Recent Search Queries
                        recentSearchesSection
                    } else {
                        // 2. Filtered Suggestions (Google suggestions & History items)
                        suggestionsSection
                    }
                }
                .padding(.top, 10)
            }
            .navigationTitle("Tìm kiếm")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Xong") {
                        navigation.goBack()
                    }
                    .font(.system(size: 16, weight: .bold))
                }
            }
            .searchable(text: $inputText, placement: .navigationBarDrawer(displayMode: .always), prompt: "Tìm hoặc nhập tên web")
            .onSubmit(of: .search) {
                submitSearch(inputText)
            }
            .onAppear {
                DispatchQueue.main.async {
                    inputText = viewModel.urlInputText
                    viewModel.fetchGoogleSuggestions(inputText)
                }
            }
            .onChange(of: inputText) { newValue in
                DispatchQueue.main.async {
                    viewModel.urlInputText = newValue
                    viewModel.fetchGoogleSuggestions(newValue)
                }
            }
            .navigationBarBackButtonHidden(true)
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
                                submitSearch(query)
                            }
                            
                            Button(action: {
                                inputText = query
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
                                submitSearch(query)
                            }
                            
                            Button(action: {
                                inputText = query
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
                $0.title.localizedCaseInsensitiveContains(inputText) || $0.url.localizedCaseInsensitiveContains(inputText)
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
                            navigation.submitSearch(query: item.url, isPrivate: viewModel.isPrivateMode)
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
    
    private func submitSearch(_ text: String) {
        viewModel.persistenceStore.addSearchQuery(text)
        navigation.submitSearch(query: text, isPrivate: viewModel.isPrivateMode)
    }
}
