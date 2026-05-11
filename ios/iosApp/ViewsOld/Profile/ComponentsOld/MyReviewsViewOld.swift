import SwiftUI
// import Shared — replaced by native Swift Shared module

struct MyReviewItemOld: Identifiable {
    let id = UUID()
    let appName: String
    let appIconColor: Color
    let rating: Int
    let date: String
    let comment: String
}

struct MyReviewsViewOld: View {
    let reviews: [MyReviewItemOld] = [
        MyReviewItemOld(appName: "EcoTrack Pro", appIconColor: .green, rating: 5, date: "2 days ago", comment: "Amazing app! Helped me reduce my carbon footprint significantly."),
        MyReviewItemOld(appName: "Pixel Art", appIconColor: .purple, rating: 4, date: "1 week ago", comment: "Great tools, but needs more layers in the free version."),
        MyReviewItemOld(appName: "Zen Space", appIconColor: .pink, rating: 5, date: "2 weeks ago", comment: "Visuals are stunning. Very relaxing.")
    ]
    
    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if reviews.isEmpty {
                    Text("No reviews yet")
                        .foregroundColor(.gray)
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
                                        .foregroundColor(.secondary)
                                }
                                Spacer()
                                Button(action: {}) {
                                    Image(systemName: "ellipsis")
                                        .foregroundColor(.gray)
                                }
                            }
                            
                            HStack(spacing: 2) {
                                ForEach(0..<5) { index in
                                    Image(systemName: "star.fill")
                                        .foregroundColor(index < review.rating ? .orange : .gray.opacity(0.3))
                                        .font(.caption)
                                }
                            }
                            
                            Text(review.comment)
                                .font(.body)
                                .foregroundColor(.primary)
                                .lineLimit(3)
                        }
                        .padding()
                        .background(Color(.secondarySystemGroupedBackground))
                        .cornerRadius(16)
                    }
                }
            }
            .padding()
        }
        .navigationTitle("My Reviews")
    }
}
