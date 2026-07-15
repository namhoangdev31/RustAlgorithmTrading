import ExploreSwiftUI
import SwiftUI

struct QuantAntNavigationRow: View {
    let title: String
    let systemImage: String
    let action: () -> Void

    var body: some View {
        UniButton(action: action) {
            HStack {
                Label(title, systemImage: systemImage)
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.caption.weight(.semibold))
                    .uniForegroundStyle(.secondary)
            }
            .contentShape(Rectangle())
        }
        .uniButtonStyle(.plain)
    }
}
