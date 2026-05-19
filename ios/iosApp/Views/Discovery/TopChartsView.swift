import ExploreSwiftUI
import SwiftUI

// import Shared — replaced by native Swift Shared module

struct TopChartApp: Identifiable {
    let id = UUID()
    let rank: Int
    let name: String
    let category: String
    let iconName: String
    let iconColor: Color
    let price: String  // "GET" or price
}

struct TopChartsView: View {
    @EnvironmentObject var navigation: NavigationViewModel
    @State private var selectedSegment = 0  // 0: Paid, 1: Free

    // Mock Data
    private let paidApps: [TopChartApp] = [
        TopChartApp(
            rank: 1, name: "Pro Camera X", category: "Photo & Video", iconName: "camera.aperture",
            iconColor: .black, price: "$4.99"),
        TopChartApp(
            rank: 2, name: "Forest Focus", category: "Productivity", iconName: "leaf.fill",
            iconColor: .green, price: "$1.99"),
        TopChartApp(
            rank: 3, name: "Sky Guide", category: "Reference", iconName: "star.fill",
            iconColor: .blue, price: "$2.99"),
        TopChartApp(
            rank: 4, name: "WolframAlpha", category: "Education", iconName: "function",
            iconColor: .orange, price: "$2.99"),
        TopChartApp(
            rank: 5, name: "GoodNotes 6", category: "Productivity", iconName: "doc.text.fill",
            iconColor: .cyan, price: "$9.99"),
    ]

    private let freeApps: [TopChartApp] = [
        TopChartApp(
            rank: 1, name: "TikTok", category: "Entertainment", iconName: "music.note",
            iconColor: .black, price: "GET"),
        TopChartApp(
            rank: 2, name: "YouTube", category: "Photo & Video", iconName: "play.rectangle.fill",
            iconColor: .red, price: "GET"),
        TopChartApp(
            rank: 3, name: "Instagram", category: "Photo & Video", iconName: "camera.fill",
            iconColor: .purple, price: "GET"),
        TopChartApp(
            rank: 4, name: "WhatsApp", category: "Social Networking", iconName: "phone.fill",
            iconColor: .green, price: "GET"),
        TopChartApp(
            rank: 5, name: "Google Maps", category: "Navigation", iconName: "map.fill",
            iconColor: .blue, price: "GET"),
    ]

    var currentApps: [TopChartApp] {
        selectedSegment == 0 ? paidApps : freeApps
    }

    var body: some View {
        VStack(spacing: 0) {
            UniPicker("Top Charts", selection: $selectedSegment) {
                Text("Paid").tag(0)
                Text("Free").tag(1)
            }
            .uniPickerStyle(.segmented)
            .padding()

            UniList {
                ForEach(currentApps) { app in
                    UniButton(action: {
                        navigation.navigate(to: .detail(itemId: app.id.uuidString))
                    }) {
                        HStack(spacing: 16) {
                            Text("\(app.rank)")
                                .font(.headline)
                                .fontWeight(.bold)
                                .frame(width: 30)  // Fixed width for alignment

                            RoundedRectangle(cornerRadius: 12)
                                .fill(app.iconColor)
                                .frame(width: 50, height: 50)
                                .overlay(
                                    Image(systemName: app.iconName)
                                        .foregroundColor(.white)
                                        .font(.title2)
                                )

                            VStack(alignment: .leading, spacing: 4) {
                                Text(app.name)
                                    .font(.headline)
                                    .lineLimit(1)
                                Text(app.category)
                                    .font(.caption)
                                    .uniForegroundStyle(.secondary)
                            }

                            Spacer()

                            Text(app.price)
                                .font(.subheadline)
                                .fontWeight(.bold)
                                .foregroundColor(.blue)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(Color.blue.opacity(0.1))
                                .clipShape(Capsule())
                        }
                        .padding(.vertical, 8)
                    }
                    .uniButtonStyle(.plain)
                }
            }
            .uniListStyle(.plain)
        }
        .navigationTitle("Top Charts")
        .navigationBarTitleDisplayMode(.inline)
    }
}
