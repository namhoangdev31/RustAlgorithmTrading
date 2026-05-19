import ExploreSwiftUI
import SwiftUI

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
                    .uniForegroundStyle(.secondary)
            }

            Spacer()

            if isDownloaded {
                UniButton(action: onOpen) {
                    Text("OPEN")
                        .font(.system(size: 14, weight: .bold))
                        .uniForegroundStyle(.white)
                        .padding(.horizontal, 20)
                        .padding(.vertical, 8)
                        .background(Color.blue)
                        .cornerRadius(20)
                }
                .uniButtonStyle(.plain)
            } else {
                UniButton(action: onDownload) {
                    Text("GET")
                        .font(.system(size: 14, weight: .bold))
                        .uniForegroundStyle(.white)
                        .padding(.horizontal, 20)
                        .padding(.vertical, 8)
                        .background(Color.blue)
                        .cornerRadius(20)
                }
                .uniButtonStyle(.plain)
            }
        }
        .padding(16)
        .background(.clear)
        .uniGlass(cornerRadius: 16)
        .padding(.horizontal)
    }
}
