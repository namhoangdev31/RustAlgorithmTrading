import SwiftUI

struct FilterSheetViewOld: View {
    @Environment(\.dismiss) var dismiss
    
    @Binding var selectedSort: String
    @Binding var selectedPrice: String
    @Binding var selectedCategory: String
    
    let sortOptions = ["Relevance", "Popularity", "Rating", "Newest"]
    let priceOptions = ["Any Price", "Free", "Paid"]
    let categoryOptions = ["All Categories", "Games", "Apps", "Entertainment", "Education", "Productivity"]
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Sort By")) {
                    Picker("Sort By", selection: $selectedSort) {
                        ForEach(sortOptions, id: \.self) { option in
                            Text(option).tag(option)
                        }
                    }
                    .pickerStyle(.inline)
                }
                
                Section(header: Text("Price")) {
                    Picker("Price", selection: $selectedPrice) {
                        ForEach(priceOptions, id: \.self) { option in
                            Text(option).tag(option)
                        }
                    }
                    // .segmented is available
                    .pickerStyle(SegmentedPickerStyle())
                }
                
                Section(header: Text("Category")) {
                    Picker("Category", selection: $selectedCategory) {
                        ForEach(categoryOptions, id: \.self) { option in
                            Text(option).tag(option)
                        }
                    }
                    // .menu is available
                    .pickerStyle(MenuPickerStyle())
                }
                
                Section {
                    Button("Reset All") {
                        selectedSort = "Relevance"
                        selectedPrice = "Any Price"
                        selectedCategory = "All Categories"
                    }
                    .foregroundColor(.red)
                }
            }
            .navigationTitle("Filters")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                    .fontWeight(.bold)
                }
            }
        }
    }
}
