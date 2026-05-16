import SwiftUI
import AdaptiveSwiftUi


struct MiniAppDetailsToolbar: ToolbarContent {
    let showNavBarItems: Bool
    let isDownloaded: Bool
    let isLoading: Bool
    let price: Double
    let onInstall: () -> Void
    let onOpen: () -> Void

    var body: some ToolbarContent {
        ToolbarItem(placement: .principal) {
            if showNavBarItems {
                Text("EcoTrack Pro")
                    .font(.headline)
                    .transition(.opacity.combined(with: .move(edge: .bottom)))
            }
        }

        ToolbarItem(placement: .navigationBarTrailing) {
            Group {
                if showNavBarItems {
                    AdaptiveButton(action: {
                        if !isDownloaded {
                            onInstall()
                        } else {
                            onOpen()
                        }
                    }) {
                        if isDownloaded {
                            Text("Open")
                                .font(.callout)
                                .fontWeight(.bold)
                                .adaptiveForegroundStyle(.white)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 6)
                        } else if isLoading {
                            AdaptiveProgressView()
                                .adaptiveProgressTint(.white)
                                .padding(.horizontal, 12)
                        } else {
                            Text(price > 0 ? String(format: "$%.2f", price) : "Get")
                                .font(.callout)
                                .fontWeight(.bold)
                                .adaptiveForegroundStyle(.white)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 6)
                        }
                    }
                    .adaptiveButtonStyle(.plain)
                    .background(Color.blue)
                    .cornerRadius(16)
                    .transition(.opacity.combined(with: .scale))
                }
            }
        }
    }
}
