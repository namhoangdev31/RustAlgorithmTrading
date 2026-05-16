import SwiftUI
import AdaptiveSwiftUi


struct DownloadHistoryItem: Identifiable {
    let id = UUID()
    let name: String
    let iconName: String
    let iconColor: Color
    let date: String
    let isInstalled: Bool
}

struct DownloadHistoryView: View {
    @EnvironmentObject var navigation: NavigationViewModel
    
    // Mock Data
    private let historyItems: [DownloadHistoryItem] = [
        DownloadHistoryItem(name: "Social Connect", iconName: "message.fill", iconColor: .blue, date: "May 20, 2026", isInstalled: true),
        DownloadHistoryItem(name: "FitTrack Pro", iconName: "heart.fill", iconColor: .red, date: "April 15, 2026", isInstalled: true),
        DownloadHistoryItem(name: "Puzzle Master", iconName: "puzzlepiece.fill", iconColor: .green, date: "March 10, 2026", isInstalled: false),
        DownloadHistoryItem(name: "Budget Planner", iconName: "dollarsign.circle.fill", iconColor: .orange, date: "February 28, 2026", isInstalled: false),
        DownloadHistoryItem(name: "Photo Editor X", iconName: "camera.fill", iconColor: .purple, date: "January 5, 2026", isInstalled: true)
    ]
    
    var body: some View {
        AdaptiveList {
            ForEach(historyItems) { item in
                HStack(spacing: 16) {
                    RoundedRectangle(cornerRadius: 10)
                        .fill(item.iconColor)
                        .frame(width: 48, height: 48)
                        .overlay(
                            Image(systemName: item.iconName)
                                .adaptiveForegroundStyle(.white)
                                .font(.title3)
                        )
                    
                    VStack(alignment: .leading, spacing: 4) {
                        Text(item.name)
                            .font(.headline)
                        Text("Downloaded on \(item.date)")
                            .font(.caption)
                            .adaptiveForegroundStyle(.secondary)
                    }
                    
                    Spacer()
                    
                    if item.isInstalled {
                        AdaptiveButton("OPEN") {
                            // Open App Logic
                        }
                        .font(.caption)
                        .adaptiveForegroundStyle(.blue)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color(.systemGray6))
                        .clipShape(Capsule())
                        .adaptiveButtonStyle(.plain)
                    } else {
                        AdaptiveButton(action: {
                            // Re-download Logic
                        }) {
                            Image(systemName: "icloud.and.arrow.down")
                                .font(.title2)
                                .adaptiveForegroundStyle(.blue)
                        }
                        .adaptiveButtonStyle(.plain)
                    }
                }
                .padding(.vertical, 4)
            }
        }
        .navigationTitle("Download History")
        .navigationBarTitleDisplayMode(.inline)
    }
}
