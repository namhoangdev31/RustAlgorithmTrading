import SwiftUI
// import Shared — replaced by native Swift Shared module

struct CategoryBrowseViewOld: View {
    @EnvironmentObject var navigation: NavigationViewModel
    
    let categories: [BrowseCategoryItem] = [
        BrowseCategoryItem(name: "Games", iconName: "gamecontroller.fill", color: .red),
        BrowseCategoryItem(name: "Productivity", iconName: "list.bullet.clipboard.fill", color: .blue),
        BrowseCategoryItem(name: "Lifestyle", iconName: "leaf.fill", color: .green),
        BrowseCategoryItem(name: "Social", iconName: "person.2.fill", color: .orange),
        BrowseCategoryItem(name: "Utilities", iconName: "wrench.and.screwdriver.fill", color: .gray),
        BrowseCategoryItem(name: "Finance", iconName: "banknote.fill", color: .purple),
        BrowseCategoryItem(name: "Health", iconName: "heart.fill", color: .pink),
        BrowseCategoryItem(name: "Education", iconName: "book.fill", color: .yellow),
        BrowseCategoryItem(name: "Entertainment", iconName: "tv.fill", color: .indigo),
        BrowseCategoryItem(name: "Travel", iconName: "airplane", color: .cyan),
        BrowseCategoryItem(name: "Shopping", iconName: "cart.fill", color: .mint),
        BrowseCategoryItem(name: "News", iconName: "newspaper.fill", color: .brown)
    ]
    
    let columns = [
        GridItem(.adaptive(minimum: 150), spacing: 16)
    ]
    
    var body: some View {
        ScrollView {
            LazyVGrid(columns: columns, spacing: 16) {
                ForEach(categories) { category in
                    Button(action: {
                        navigation.navigate(to: .categoryDetail(id: category.id.uuidString, title: category.name))
                    }) {
                        VStack(spacing: 12) {
                            Circle()
                                .fill(category.color.opacity(0.1))
                                .frame(width: 60, height: 60)
                                .overlay(
                                    Image(systemName: category.iconName)
                                        .font(.title2)
                                        .foregroundColor(category.color)
                                )
                            
                            Text(category.name)
                                .font(.headline)
                                .foregroundColor(.primary)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 24)
                        .background(Color(.secondarySystemBackground))
                        .cornerRadius(16)
                    }
                }
            }
            .padding()
        }
        .navigationTitle("Browse Categories")
    }
}
