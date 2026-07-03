import ExploreSwiftUI
import SwiftUI

struct DiscoveryHeaderView: View {
    let offsetY: CGFloat

    init(offsetY: CGFloat = 0) {
        self.offsetY = offsetY
    }

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("WEDNESDAY, MAY 22")
                    .font(.caption)
                    .uniSemi()
                    .uniForegroundStyle(.secondary)

                Text("Discover")
                    .font(.largeTitle)
                    .uniBold()
            }

            Spacer()
            UniButton(action: {}) {
                Image(systemName: "ellipses.bubble")  // AI Chat Icon Placeholder
                    .font(.system(size: 22))
                    .uniForegroundStyle(.leposPrimary)
            }
        }
        .padding(.horizontal)
    }
}
