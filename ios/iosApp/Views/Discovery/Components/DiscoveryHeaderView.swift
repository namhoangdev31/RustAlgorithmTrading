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
                    .fontWeight(.semibold)
                    .uniForegroundStyle(.secondary)

                Text("Discover")
                    .font(.largeTitle)
                    .fontWeight(.bold)
            }

            Spacer()
            UniButton(action: {}) {
                Image(systemName: "ellipses.bubble")  // AI Chat Icon Placeholder
                    .font(.system(size: 22))
                    .foregroundColor(.leposPrimary)
            }
        }
        .padding(.horizontal)
    }
}
