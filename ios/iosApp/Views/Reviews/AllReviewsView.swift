import ExploreSwiftUI
import SwiftUI

struct ReviewItem: Identifiable {
    let id = UUID()
    let author: String
    let rating: Int
    let date: String
    let title: String
    let content: String
}

struct AllReviewsView: View {
    let appId: String
    @EnvironmentObject var navigation: NavigationViewModel

    // Mock Data
    private let reviews: [ReviewItem] = [
        ReviewItem(
            author: "EcoFan99", rating: 5, date: "2 days ago", title: "Life changing!",
            content:
                "This app has completely changed how I view my daily habits. Highly recommended!"),
        ReviewItem(
            author: "GreenUser", rating: 4, date: "4 days ago", title: "Incredible impact",
            content:
                "The UI is beautiful and the tracking is scary accurate. I've already reduced my weekly carbon output by 15% just by making small changes recommended by the app."
        ),
        ReviewItem(
            author: "NatureLover", rating: 5, date: "1 week ago", title: "Best in class",
            content:
                "I've tried many apps like this, but this one is by far the best. Smooth animation, great data visualization."
        ),
        ReviewItem(
            author: "CityDweller", rating: 3, date: "2 weeks ago",
            title: "Good but needs dark mode",
            content: "Great functionality but really needs a true dark mode for night usage."),
        ReviewItem(
            author: "Techie", rating: 4, date: "3 weeks ago", title: "Solid app",
            content: "Does what it says. No bugs found so far."),
        ReviewItem(
            author: "Newbie", rating: 5, date: "1 month ago", title: "Simple and effective",
            content: "Very easy to use, even for non-tech savvy people."),
    ]

    @State private var sortOption = 0  // 0: Most Recent, 1: Most Helpful, 2: Critical, 3: Positive

    var body: some View {
        UniScrollView {
            VStack(alignment: .leading, spacing: 16) {
                // Header / Summary (Optional, sticking to list for now)

                // Sort control
                Picker("Sort", selection: $sortOption) {
                    Text("Most Recent").tag(0)
                    Text("Most Helpful").tag(1)
                    Text("Critical").tag(2)
                    Text("Positive").tag(3)
                }
                .pickerStyle(SegmentedPickerStyle())
                .padding(.horizontal)

                LazyVStack(spacing: 20) {
                    ForEach(reviews) { review in
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text(review.title)
                                    .font(.headline)
                                Spacer()
                                Text(review.date)
                                    .font(.caption)
                                    .uniForegroundStyle(.secondary)
                            }

                            HStack(spacing: 2) {
                                ForEach(0..<5) { index in
                                    Image(systemName: index < review.rating ? "star.fill" : "star")
                                        .uniForegroundStyle(.orange)
                                        .font(.caption)
                                }
                                Spacer()
                                Text(review.author)
                                    .font(.caption)
                                    .uniForegroundStyle(.secondary)
                            }

                            Text(review.content)
                                .font(.body)
                                .uniForegroundStyle(.primary)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                        .padding()
                        .uniGlass(cornerRadius: 12)
                    }
                }
                .padding(.horizontal)
            }
            .padding(.vertical)
        }
        .navigationTitle("Ratings & Reviews")
        .navigationBarTitleDisplayMode(.inline)
    }
}
