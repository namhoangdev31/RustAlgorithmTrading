import SwiftUI
import AdaptiveSwiftUi

// import Shared — replaced by native Swift Shared module

struct MyReviewItem: Identifiable {
    let id = UUID()
    let appName: String
    let appIconColor: Color
    let rating: Int
    let date: String
    let comment: String
}

struct MyReviewsView: View {
    let reviews: [MyReviewItem] = [
        MyReviewItem(appName: "EcoTrack Pro", appIconColor: .green, rating: 5, date: "2 days ago", comment: "Amazing app! Helped me reduce my carbon footprint significantly."),
        MyReviewItem(appName: "Pixel Art", appIconColor: .purple, rating: 4, date: "1 week ago", comment: "Great tools, but needs more layers in the free version."),
        MyReviewItem(appName: "Zen Space", appIconColor: .pink, rating: 5, date: "2 weeks ago", comment: "Visuals are stunning. Very relaxing.")
    ]
    
    var body: some View {
        AdaptiveScrollView {
            VStack(spacing: 16) {
                if reviews.isEmpty {
                    Text("No reviews yet")
                        .adaptiveForegroundStyle(.secondary)
                        .padding(.top, 40)
                } else {
                    ForEach(reviews) { review in
                        VStack(alignment: .leading, spacing: 12) {
                            HStack {
                                RoundedRectangle(cornerRadius: 8)
                                    .fill(review.appIconColor)
                                    .frame(width: 40, height: 40)
                                    .overlay(
                                        Text(String(review.appName.prefix(1)))
                                            .foregroundColor(.white)
                                            .fontWeight(.bold)
                                    )
                                
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(review.appName)
                                        .font(.headline)
                                    Text(review.date)
                                        .font(.caption)
                                        .adaptiveForegroundStyle(.secondary)
                                }
                                Spacer()
                                AdaptiveButton(action: {}) {
                                    Image(systemName: "ellipsis")
                                        .adaptiveForegroundStyle(.secondary)
                                }
                                .adaptiveButtonStyle(.plain)
                            }
                            
                            HStack(spacing: 2) {
                                ForEach(0..<5) { index in
                                    Image(systemName: "star.fill")
                                        .adaptiveForegroundStyle(index < review.rating ? .orange : .secondary, opacity: index < review.rating ? 1.0 : 0.3)
                                        .font(.caption)
                                }
                            }
                            
                            Text(review.comment)
                                .font(.body)
                                .foregroundColor(.primary)
                                .lineLimit(3)
                        }
                        .padding()
                        .adaptiveGlass(cornerRadius: 16)
                    }
                }
            }
            .padding()
        }
        .navigationTitle("My Reviews")
    }
}
