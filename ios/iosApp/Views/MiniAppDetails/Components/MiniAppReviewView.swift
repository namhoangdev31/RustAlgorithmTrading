import ExploreSwiftUI
import SwiftUI

struct MiniAppReviewView: View {
    @EnvironmentObject var navigation: NavigationViewModel
    var appId: String = "mock_app"

    var body: some View {
        VStack(alignment: .leading, spacing: 15) {
            HStack {
                Text("Ratings & Reviews")
                    .font(.title2)
                    .fontWeight(.bold)
                Spacer()
                UniButton(action: {
                    navigation.navigate(to: .allReviews(appId: appId))
                }) {
                    Text("See All")
                        .font(.body)
                        .uniForegroundStyle(.blue)
                }
                .uniButtonStyle(.plain)
            }

            HStack(alignment: .top, spacing: 20) {
                // Big Score
                VStack(spacing: 0) {
                    Text("4.8")
                        .font(.system(size: 60, weight: .bold))
                        .foregroundColor(.primary)
                    Text("out of 5")
                        .font(.system(size: 15, weight: .bold))
                        .uniForegroundStyle(.secondary)
                }

                // Bars
                VStack(spacing: 4) {
                    RatingBarRow(stars: 5, value: 0.9)
                    RatingBarRow(stars: 4, value: 0.1)
                    RatingBarRow(stars: 3, value: 0.05)
                    RatingBarRow(stars: 2, value: 0.02)
                    RatingBarRow(stars: 1, value: 0.03)
                }
                .frame(maxWidth: .infinity)

                VStack(alignment: .trailing) {
                    Text("2,432 Ratings")
                        .font(.caption)
                        .uniForegroundStyle(.secondary)
                        .padding(.top, 80)  // Align to bottom roughly
                }
            }

            UniButton(action: {
                navigation.navigate(to: .writeReview(appId: appId))
            }) {
                HStack {
                    Image(systemName: "square.and.pencil")
                    Text("Write a Review")
                }
                .font(.headline)
                .uniForegroundStyle(.blue)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 10)
                .background(Color.blue.opacity(0.1))
                .cornerRadius(10)
            }
            .uniButtonStyle(.plain)

            // Featured Review Card
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("Incredible impact")
                        .font(.headline)
                    Spacer()
                    Text("4d ago")
                        .font(.caption)
                        .uniForegroundStyle(.secondary)
                }

                HStack(spacing: 2) {
                    ForEach(0..<5) { _ in
                        Image(systemName: "star.fill")
                            .foregroundColor(.orange)
                            .font(.system(size: 12))
                    }
                }

                Text(
                    "The UI is beautiful and the tracking is scary accurate. I've already reduced my weekly carbon output by 15% just by making small changes recommended by the app."
                )
                .font(.body)
                .lineLimit(4)
                .padding(.top, 4)
            }
            .padding()
            .uniGlass(cornerRadius: 12)
        }
        .padding()
    }
}

struct RatingBarRow: View {
    let stars: Int
    let value: CGFloat

    var body: some View {
        HStack(spacing: 8) {
            HStack(spacing: 0) {
                Spacer()
                ForEach(0..<stars, id: \.self) { _ in
                    Image(systemName: "star.fill")  // Using simple representation to save space, or just text
                        .font(.system(size: 6))
                        .opacity(0)  // Just sizing hack if needed, effectively simpler:
                }
            }
            .frame(width: 10)  // Fixed width for alignment if doing text labels
            // Actually App Store style: "Star Icon 5" -----BAR-----

            HStack {
                Spacer()
                ForEach(0..<stars, id: \.self) { _ in }  // Placeholder loop
                // Real App Store doesn't verify star count on left side usually, just bar position.
                // Let's mimic visual:
            }
            .frame(width: 0)  // Skip complex star row for now

            // Star row alignment is tricky without fixed frame.
            // Simplified: Bar only
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 2)
                        .fill(Color.gray.opacity(0.3))
                        .frame(height: 4)

                    RoundedRectangle(cornerRadius: 2)
                        .fill(Color.gray)
                        .frame(width: geo.size.width * value, height: 4)
                }
            }
            .frame(height: 4)
        }
    }
}
