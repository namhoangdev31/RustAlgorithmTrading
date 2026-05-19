import ExploreSwiftUI
import SwiftUI

struct RecommendedApp: Identifiable {
    let id = UUID()
    let name: String
    let subtitle: String
    let rating: Double
    let iconColor: Color
}

struct RecommendedForYouView: View {
    let apps = [
        RecommendedApp(
            name: "GourmetGo", subtitle: "Curated local dining", rating: 4.9, iconColor: .orange),
        RecommendedApp(
            name: "TravelBuddy", subtitle: "Trip planning", rating: 4.6, iconColor: .blue),
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Recommended for You")
                    .font(.headline)
                    .fontWeight(.bold)
                Spacer()
                UniButton("View all") {}
                    .font(.subheadline)
                    .uniForegroundStyle(.blue)
                    .uniButtonStyle(.plain)
            }
            .padding(.horizontal)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 16) {
                    ForEach(apps) { app in
                        AppRecommendationCard(app: app)
                    }
                }
                .padding(.horizontal)
            }
        }
    }
}

struct AppRecommendationCard: View {
    let app: RecommendedApp

    var body: some View {
        RoundedRectangle(cornerRadius: 20)
            .fill(Color(.systemGray6))
            .overlay(
                VStack(alignment: .leading) {
                    // Image Placeholder
                    RoundedRectangle(cornerRadius: 16)
                        .fill(
                            LinearGradient(
                                colors: [app.iconColor.opacity(0.3), app.iconColor.opacity(0.1)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(height: 180)

                    HStack(alignment: .top, spacing: 12) {
                        Circle()
                            .fill(app.iconColor.opacity(0.2))
                            .frame(width: 40, height: 40)
                            .overlay(
                                Image(systemName: "fork.knife")
                                    .uniForegroundStyle(app.iconColor)
                            )

                        VStack(alignment: .leading, spacing: 4) {
                            Text(app.name)
                                .font(.subheadline)
                                .fontWeight(.bold)
                            Text(app.subtitle)
                                .font(.caption)
                                .uniForegroundStyle(.secondary)
                        }

                        Spacer()
                    }

                    HStack {
                        HStack(spacing: 2) {
                            Image(systemName: "star.fill")
                                .font(.caption2)
                                .uniForegroundStyle(.orange)
                            Text(String(format: "%.1f", app.rating))
                                .font(.caption)
                                .fontWeight(.semibold)
                        }

                        Spacer()

                        UniButton(action: {}) {
                            Text("GET")
                                .font(.caption)
                                .fontWeight(.bold)
                                .uniForegroundStyle(.white)
                                .padding(.horizontal, 20)
                                .padding(.vertical, 6)
                                .background(Color.blue)
                                .clipShape(Capsule())
                        }
                        .uniButtonStyle(.plain)
                    }
                }
                .padding(12)
            )
            .frame(width: 250, height: 300)
            .uniGlass(cornerRadius: 20)
    }
}
