import SwiftUI

@available(iOS 26.0 , *)
struct SearchView: View {
    @State private var isSearching: Bool = false
    @State private var searchText: String = ""
    @State private var isFilterPresented = false
    @State private var selectedSort = "Relevance"
    @State private var selectedPrice = "Any Price"
    @State private var selectedCategory = "All Categories"
    
    var body: some View {
        NavigationView {
            ScrollView {
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
            .navigationSubtitle("Quick Categories")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    HStack(spacing: 16) {
                        Button(action: {
                            isFilterPresented = true
                        }) {
                            Image(systemName: "slider.horizontal.3")
                                .font(.title3)
                                .foregroundColor(.blue)
                        }
                        
                        Image(systemName: "barcode.viewfinder")
                            .font(.title2)
                            .foregroundColor(.gray)
                    }
                }
                ToolbarItem(placement: .navigationBarLeading) {
                    Image(systemName: "mic.circle")
                        .font(.title2)
                        .foregroundColor(.gray)
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
        .onChange(of: searchText) { oldValue, newValue in
            if newValue.isEmpty {
                isSearching = false
            } else {
                // If user types again, go back to suggestions until they hit enter
                isSearching = false 
            }
        }
    }
}
