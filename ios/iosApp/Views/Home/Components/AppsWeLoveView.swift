import SwiftUI

struct AppItem: Identifiable {
    let id = UUID()
    let name: String
    let category: String
    let iconColor: Color
    let iconName: String
}

struct AppsWeLoveView: View {
    @EnvironmentObject var navigation: NavigationViewModel
    let apps: [AppItem] = [
        AppItem(name: "QuickTask Pro", category: "Productivity", iconColor: .black, iconName: "checkmark.circle.fill"),
        AppItem(name: "Wealth Insights", category: "Finance", iconColor: .blue, iconName: "chart.bar.fill"),
        AppItem(name: "EcoTrack", category: "Lifestyle", iconColor: .green, iconName: "leaf.fill")
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Apps We Love")
                    .font(.title2)
                    .fontWeight(.bold)
                Spacer()
                Button("See All") {
                    navigation.navigate(to: .collection(id: "apps_we_love", title: "Apps We Love"))
                }
                .font(.subheadline)
                .foregroundColor(.blue)
            }
            .padding(.horizontal)

            ForEach(apps) { app in
                HStack(spacing: 16) {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(app.iconColor)
                        .frame(width: 60, height: 60)
                        .overlay(
                            Image(systemName: app.iconName)
                                .font(.title2)
                                .foregroundColor(.white)
                        )

                    VStack(alignment: .leading, spacing: 4) {
                        Text(app.name)
                            .font(.headline)
                        Text(app.category)
                            .font(.subheadline)
                            .foregroundColor(.gray)
                    }

                    Spacer()

                    Button(action: {}) {
                        Text("OPEN")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.blue)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .background(Color(.systemGray6))
                            .clipShape(Capsule())
                    }
                }
                .padding(.horizontal)

                if app.id != apps.last?.id {
                    Divider().padding(.leading, 80)
                }
            }
        }
    }
}
