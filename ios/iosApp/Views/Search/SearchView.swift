import SwiftUI
import AdaptiveSwiftUi


struct SearchView: View {
    @State private var isSearching: Bool = false
    @State private var searchText: String = ""
    @State private var isFilterPresented = false
    @State private var selectedSort = "Relevance"
    @State private var selectedPrice = "Any Price"
    @State private var selectedCategory = "All Categories"
    
    var body: some View {
        NavigationView {
            AdaptiveScrollView {
                VStack(spacing: 16) {
                    if searchText.isEmpty {
                        SearchQuickCategoriesView()
                        RecommendedForYouView()
                        TrendingSearchesView()
                    } else if isSearching {
                        SearchResultsView(query: searchText)
                    } else {
                        SearchSuggestionsView(query: searchText)
                    }
                    
                    Spacer(minLength: 50)
                }
                .padding(.bottom, 20)
            }
            .navigationTitle("Search")
            
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    HStack(spacing: 16) {
                        AdaptiveButton(action: {
                            isFilterPresented = true
                        }) {
                            Image(systemName: "slider.horizontal.3")
                                .font(.title3)
                                .adaptiveForegroundStyle(.blue)
                        }
                        .adaptiveButtonStyle(.plain)
                        
                        Image(systemName: "barcode.viewfinder")
                            .font(.title2)
                            .adaptiveForegroundStyle(.secondary)
                    }
                }
                ToolbarItem(placement: .navigationBarLeading) {
                    Image(systemName: "mic.circle")
                        .font(.title2)
                        .adaptiveForegroundStyle(.secondary)
                }
            }
            .sheet(isPresented: $isFilterPresented) {
                FilterSheetView(
                    selectedSort: $selectedSort,
                    selectedPrice: $selectedPrice,
                    selectedCategory: $selectedCategory
                )
            }
        }
        .searchable(text: $searchText, placement: .automatic, prompt: "Search mini-apps, services...")
        .onSubmit(of: .search) {
            isSearching = true
        }
        .onChange(of: searchText) { newValue in
            if newValue.isEmpty {
                isSearching = false
            } else {
                isSearching = false
            }
        }
    }
}
