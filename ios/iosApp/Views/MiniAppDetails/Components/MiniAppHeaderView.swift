import ExploreSwiftUI
import SwiftUI

// import Shared — replaced by native Swift Shared module

struct MiniAppHeaderView: View {
    @EnvironmentObject var navigation: NavigationViewModel
    // UI-only: No data model dependency
    let isDownloaded: Bool
    let isLoading: Bool
    let onOpen: () -> Void
    let onDownload: () -> Void
    let onUninstall: () -> Void
    let onSettings: () -> Void

    var body: some View {
        HStack(alignment: .top, spacing: 16) {
            // App Icon
            RoundedRectangle(cornerRadius: 22)
                .fill(Color.blue.opacity(0.1))
                .frame(width: 118, height: 118)
                .overlay(
                    Image(systemName: "cube.box.fill")  // Mock Icon
                        .font(.system(size: 50))
                        .uniForegroundStyle(.blue)
                )
                .clipShape(RoundedRectangle(cornerRadius: 22))
                .shadow(color: .black.opacity(0.1), radius: 10, x: 0, y: 5)

            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text("EcoTrack Pro")  // Mock Name
                        .font(.system(size: 22, weight: .bold))
                        .fixedSize(horizontal: false, vertical: true)
                    Image(systemName: "checkmark.seal.fill")  // Mock Icon
                        .font(.system(size: 22))
                        .uniForegroundStyle(.green)
                }

                UniButton(action: {
                    navigation.navigate(to: .developer(id: "mock_dev"))
                }) {
                    Text("EcoSolutions Inc.")
                        .font(.subheadline)
                        .uniForegroundStyle(.blue)
                }
                .uniButtonStyle(.plain)

                Text("Carbon Footprint Tracker")  // Mock Description
                    .font(.system(size: 15))
                    .uniForegroundStyle(.secondary)
                    .lineLimit(1)

                Spacer()

                HStack {
                    if isDownloaded {
                        UniButton(action: onOpen) {
                            Text("OPEN")
                                .font(.system(size: 15, weight: .bold))
                                .uniForegroundStyle(.white)
                                .padding(.horizontal, 20)
                                .padding(.vertical, 7)
                                .background(Color.blue)
                                .cornerRadius(50)
                        }
                        .uniButtonStyle(.plain)

                        // Uninstall Button (Action Menu Style)
                        UniMenu {
                            UniButton(role: .cancel, action: onSettings) {
                                Label("Settings", systemImage: "gear")
                            }
                            UniButton(role: .destructive, action: onUninstall) {
                                Label("Remove App", systemImage: "trash")
                            }
                        } label: {
                            Image(systemName: "ellipsis.circle.fill")
                                .font(.system(size: 32))
                                .uniForegroundStyle(.blue, opacity: 0.1)
                                .overlay(
                                    Image(systemName: "ellipsis")
                                        .font(.system(size: 14, weight: .bold))
                                        .uniForegroundStyle(.blue)
                                )
                        }

                    } else {
                        UniButton(action: onDownload) {
                            if isLoading {
                                UniProgressView()
                                    .uniProgressTint(.white)
                                    .frame(width: 74, height: 30)
                                    .background(Color.blue)
                                    .cornerRadius(15)
                            } else {
                                HStack {
                                    Image(systemName: "icloud.and.arrow.down")  // Mock Icon
                                        .font(.system(size: 13))
                                        .uniForegroundStyle(.white)
                                    Text("GET")
                                        .font(.system(size: 13, weight: .bold))
                                        .uniForegroundStyle(.white)

                                }.padding(.horizontal, 20)
                                    .padding(.vertical, 7)
                                    .background(Color.blue)
                                    .cornerRadius(50)
                            }
                        }
                        .uniButtonStyle(.plain)
                    }

                    Spacer()

                    UniButton(action: {}) {
                        Image(systemName: "square.and.arrow.up")
                            .font(.system(size: 20))
                            .uniForegroundStyle(.blue)
                    }
                    .uniButtonStyle(.plain)
                }

                Text("IN-APP PURCHASES")
                    .font(.system(size: 10, weight: .medium))
                    .uniForegroundStyle(.secondary, opacity: 0.5)
                    .padding(.top, 4)
            }
        }
        .padding()
    }
}
