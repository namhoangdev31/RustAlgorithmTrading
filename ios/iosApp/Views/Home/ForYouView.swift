import ExploreSwiftUI
import SwiftUI

// import Shared — replaced by native Swift Shared module

struct ForYouView: View {
    @EnvironmentObject var navigation: NavigationViewModel

    // Mock Data
    private let recommendations = [
        (
            name: "Zen Focus", icon: "brain.head.profile", color: Color.purple,
            category: "Productivity", rating: 4.8
        ),
        (
            name: "Daily Planner", icon: "calendar", color: Color.blue, category: "Productivity",
            rating: 4.7
        ),
        (name: "Hydrate", icon: "drop.fill", color: Color.cyan, category: "Health", rating: 4.9),
        (
            name: "Sleep Well", icon: "moon.stars.fill", color: Color.indigo, category: "Health",
            rating: 4.6
        ),
        (
            name: "FitTrack", icon: "figure.run", color: Color.green, category: "Fitness",
            rating: 4.5
        ),
        (name: "CookBook", icon: "fork.knife", color: Color.orange, category: "Food", rating: 4.8),
        (name: "Travel Mate", icon: "airplane", color: Color.teal, category: "Travel", rating: 4.4),
        (
            name: "Learn Code", icon: "laptopcomputer", color: Color.gray, category: "Education",
            rating: 4.9
        ),
    ]

    var body: some View {
        UniScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text("Because you like Productivity")
                    .font(.headline)
                    .padding(.horizontal)
                    .padding(.top)

                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                    ForEach(0..<recommendations.count, id: \.self) { index in
                        let app = recommendations[index]
                        UniButton(action: {
                            navigation.navigate(to: .detail(itemId: "mock_\(index)"))
                        }) {
                            VStack(alignment: .leading, spacing: 12) {
                                RoundedRectangle(cornerRadius: 16)
                                    .fill(app.color.opacity(0.1))
                                    .frame(height: 120)
                                    .overlay(
                                        Image(systemName: app.icon)
                                            .font(.system(size: 40))
                                            .uniForegroundStyle(app.color)
                                    )

                                VStack(alignment: .leading, spacing: 4) {
                                    Text(app.name)
                                        .font(.headline)
                                        .uniForegroundStyle(.primary)
                                        .lineLimit(1)

                                    Text(app.category)
                                        .font(.caption)
                                        .uniForegroundStyle(.secondary)

                                    HStack(spacing: 4) {
                                        Image(systemName: "star.fill")
                                            .font(.caption2)
                                            .foregroundColor(.yellow)
                                        Text(String(format: "%.1f", app.rating))
                                            .font(.caption2)
                                            .uniForegroundStyle(.secondary)
                                    }
                                }
                            }
                            .padding(12)
                            .uniGlass(cornerRadius: 16)
                            .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
                        }
                        .uniButtonStyle(.plain)
                    }
                }
                .padding(.horizontal)
            }
        }
        .navigationTitle("For You")
        .navigationBarTitleDisplayMode(.large)
        .background(Color(.systemGroupedBackground))
    }
}
