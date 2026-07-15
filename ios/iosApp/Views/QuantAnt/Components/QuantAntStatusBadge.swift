import ExploreSwiftUI
import SwiftUI

struct QuantAntStatusBadge: View {
    let title: String
    let color: Color

    var body: some View {
        Text(title.uppercased())
            .font(.caption2.weight(.bold))
            .padding(.horizontal, 9)
            .padding(.vertical, 5)
            .uniForegroundStyle(color)
            .background(color.opacity(0.13), in: Capsule())
            .accessibilityLabel(title)
    }
}

