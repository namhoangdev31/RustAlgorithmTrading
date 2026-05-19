import ExploreSwiftUI
import SwiftUI

struct CategoryItem: Identifiable {
    let id = UUID()
    let name: String
    let icon: String
    let color: Color
}

struct SearchQuickCategoriesView: View {
    let categories = [
        CategoryItem(name: "Dining", icon: "fork.knife", color: Color.cyan.opacity(0.2)),
        CategoryItem(name: "Travel", icon: "airplane", color: Color.orange.opacity(0.2)),
        CategoryItem(name: "Games", icon: "gamecontroller.fill", color: Color.purple.opacity(0.2)),
        CategoryItem(name: "Leisure", icon: "leaf.fill", color: Color.green.opacity(0.2)),
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                CategoryCard(
                    name: categories[0].name,
                    icon: categories[0].icon,
                    color: categories[0].color,
                    isLarge: true
                )

                CategoryCard(
                    name: categories[1].name,
                    icon: categories[1].icon,
                    color: categories[1].color,
                    isLarge: true
                )

                CategoryCard(
                    name: categories[2].name,
                    icon: categories[2].icon,
                    color: categories[2].color,
                    isLarge: false
                )

                CategoryCard(
                    name: categories[3].name,
                    icon: categories[3].icon,
                    color: categories[3].color,
                    isLarge: false
                )
            }
            .padding(.horizontal)
        }
    }
}

struct CategoryCard: View {
    let name: String
    let icon: String
    let color: Color
    let isLarge: Bool

    var body: some View {
        RoundedRectangle(cornerRadius: 20)
            .fill(color)
            .uniGlass(cornerRadius: 20)
            .overlay(
                VStack(alignment: .leading) {
                    if isLarge {
                        Spacer()
                    }

                    Image(systemName: icon)
                        .font(isLarge ? .largeTitle : .title2)
                        .uniForegroundStyle(getIconColor())

                    Spacer()

                    Text(name)
                        .font(isLarge ? .title3 : .subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(.primary)
                }
                .padding(isLarge ? 24 : 16)
                .frame(maxWidth: .infinity, alignment: .leading)
            )
            .frame(height: isLarge ? 160 : 70)
    }

    private func getIconColor() -> Color {
        if color == Color.cyan.opacity(0.2) {
            return .cyan
        } else if color == Color.orange.opacity(0.2) {
            return .orange
        } else if color == Color.purple.opacity(0.2) {
            return .purple
        } else {
            return .green
        }
    }
}
