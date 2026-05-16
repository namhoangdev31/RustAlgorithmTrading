import AdaptiveSwiftUi
import SwiftUI

struct TrendingSearch: Identifiable {
    let id = UUID()
    let rank: Int
    let title: String
    let tag: String
    let tagColor: Color
}

struct TrendingSearchesView: View {
    let searches = [
        TrendingSearch(rank: 1, title: "Summer Retreats", tag: "RISING", tagColor: .green),
        TrendingSearch(rank: 2, title: "Fitness Trackers", tag: "POPULAR", tagColor: .blue),
        TrendingSearch(rank: 3, title: "Artisan Coffee", tag: "NEW", tagColor: .orange),
        TrendingSearch(rank: 4, title: "Night Sky VR", tag: "HOT", tagColor: .red),
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Trending Searches")
                .font(.headline)
                .fontWeight(.bold)
                .padding(.horizontal)

            VStack(spacing: 12) {
                ForEach(searches) { search in
                    HStack(spacing: 16) {
                        Text("\(search.rank)")
                            .font(.title3)
                            .fontWeight(.bold)
                            .adaptiveForegroundStyle(.secondary, opacity: 0.3)
                            .frame(width: 30)

                        VStack(alignment: .leading, spacing: 4) {
                            Text(search.title)
                                .font(.subheadline)
                                .fontWeight(.semibold)
                            Text(search.tag)
                                .font(.caption2)
                                .fontWeight(.bold)
                                .adaptiveForegroundStyle(search.tagColor)
                        }

                        Spacer()

                        Image(systemName: "arrow.up.right")
                            .font(.caption)
                            .adaptiveForegroundStyle(.secondary, opacity: 0.5)
                    }
                    .padding(.horizontal)

                    if search.rank < searches.count {
                        AdaptiveDivider()
                            .padding(.horizontal)
                    }
                }
            }
        }
    }
}
