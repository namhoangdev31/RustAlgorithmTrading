import ExploreSwiftUI
import SwiftUI

struct CollectionItem: Identifiable {
    let id = UUID()
    let title: String
    let subtitle: String
    let color: Color
}

struct TopCollectionsView: View {
    @EnvironmentObject var navigation: NavigationViewModel
    let collections: [CollectionItem] = [
        CollectionItem(
            title: "Essential FinTech\nfor 2024",
            subtitle: "Manage everything from crypto to classic banking.", color: .black),
        CollectionItem(
            title: "Weekend Vibes", subtitle: "The best food delivery apps.", color: .orange),
        CollectionItem(
            title: "Learn New Skills", subtitle: "Education apps for everyone.", color: .purple),
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Top Collections")
                    .font(.title2)
                    .fontWeight(.bold)
                Spacer()
                UniButton(action: {
                    navigation.navigate(
                        to: .collection(id: "top_collections", title: "Top Collections"))
                }) {
                    Text("See All")
                }
                .uniButtonStyle(.plain)
                .uniForegroundStyle(.blue)
            }
            .padding(.horizontal)

            UniScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 16) {
                    ForEach(collections) { item in
                        UniButton(action: {
                            navigation.navigate(
                                to: .collection(
                                    id: item.id.uuidString, title: "Featured Collection"))
                        }) {
                            VStack(alignment: .leading) {
                                RoundedRectangle(cornerRadius: 16)
                                    .fill(item.color.opacity(0.8))
                                    .frame(height: 140)
                                    .overlay(
                                        VStack {
                                            Spacer()
                                            // Placeholder graphic overlay if needed
                                        }
                                    )

                                Text("CURATED")
                                    .font(.caption2)
                                    .fontWeight(.bold)
                                    .foregroundColor(.blue)
                                    .padding(.top, 8)

                                Text(item.title)
                                    .font(.headline)
                                    .lineLimit(2)
                                    .multilineTextAlignment(.leading)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .frame(height: 50, alignment: .topLeading)  // Reserve space for 2 lines
                                    .padding(.bottom, 2)

                                Text(item.subtitle)
                                    .font(.caption)
                                    .uniForegroundStyle(.secondary)
                                    .lineLimit(2)
                            }
                            .frame(width: 220)
                        }
                    }
                    .padding(.horizontal)
                }
            }
        }
    }
}
