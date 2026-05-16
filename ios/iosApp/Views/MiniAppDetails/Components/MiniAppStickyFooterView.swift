import SwiftUI
import AdaptiveSwiftUi

struct MiniAppStickyFooterView: View {
    let isDownloaded: Bool
    let onOpen: () -> Void
    let onDownload: () -> Void

    var body: some View {
        HStack {
            Image(systemName: "cube.box.fill")
                .resizable()
                .padding(8)
                .background(Color.blue.opacity(0.1))
                .frame(width: 40, height: 40)
                .cornerRadius(8)

            VStack(alignment: .leading, spacing: 2) {
                Text("EcoTrack Pro")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                Text("Productivity")
                    .font(.caption)
                    .adaptiveForegroundStyle(.secondary)
            }

            Spacer()

            if isDownloaded {
                AdaptiveButton(action: onOpen) {
                    Text("OPEN")
                        .font(.system(size: 14, weight: .bold))
                        .adaptiveForegroundStyle(.white)
                        .padding(.horizontal, 20)
                        .padding(.vertical, 8)
                        .background(Color.blue)
                        .cornerRadius(20)
                }
                .adaptiveButtonStyle(.plain)
            } else {
                AdaptiveButton(action: onDownload) {
                    Text("GET")
                        .font(.system(size: 14, weight: .bold))
                        .adaptiveForegroundStyle(.white)
                        .padding(.horizontal, 20)
                        .padding(.vertical, 8)
                        .background(Color.blue)
                        .cornerRadius(20)
                }
                .adaptiveButtonStyle(.plain)
            }
        }
        .padding(16)
        .background(.clear)
        .adaptiveGlass(cornerRadius: 16)
        .padding(.horizontal)
    }
}
