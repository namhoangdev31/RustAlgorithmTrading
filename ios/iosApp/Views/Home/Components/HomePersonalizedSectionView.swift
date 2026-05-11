import SwiftUI

struct HomePersonalizedSectionView: View {
    let title: String
    let subtitle: String

    @EnvironmentObject var navigation: NavigationViewModel

    // Mock Data
    private let apps = [
        (name: "Zen Focus", icon: "brain.head.profile", color: Color.purple),
        (name: "Daily Planner", icon: "calendar", color: Color.blue),
        (name: "Hydrate", icon: "drop.fill", color: Color.cyan),
        (name: "Sleep Well", icon: "moon.stars.fill", color: Color.indigo)
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.title3)
                        .fontWeight(.bold)

                    Text(subtitle)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }

                Spacer()

                Button("See All") {
                    if title == "For You" {
                        navigation.navigate(to: .forYou)
                    } else {
                        // For other sections, maybe navigate elsewhere or do nothing for now
                        print("Navigate to \(title)")
                    }
                }
                .font(.subheadline)
                .foregroundColor(.blue)
            }
            .padding(.horizontal)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 16) {
                    ForEach(0..<4) { index in
                        let app = apps[index]

                        VStack(alignment: .leading, spacing: 8) {
                            RoundedRectangle(cornerRadius: 16)
                                .fill(app.color.opacity(0.1))
                                .frame(width: 140, height: 140)
                                .overlay(
                                    Image(systemName: app.icon)
                                        .font(.system(size: 40))
                                        .foregroundColor(app.color)
                                )

                            VStack(alignment: .leading, spacing: 2) {
                                Text(app.name)
                                    .font(.headline)
                                    .lineLimit(1)

                                Text("Lifestyle")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                        .frame(width: 140)
                    }
                }
                .padding(.horizontal)
            }
        }
        .padding(.vertical, 8)
    }
}
