import ExploreSwiftUI
import SwiftUI

struct QuantAntRecordRow: View {
    let record: QuantAntRecordDTO
    let icon: String

    var body: some View {
        HStack {
            Image(systemName: icon)
                .uniForegroundStyle(QuantAntTheme.indigo)
            VStack(alignment: .leading) {
                Text(record.name ?? record.id)
                    .font(.headline)
                    .lineLimit(1)
                Text(record.status ?? "")
                    .font(.caption)
                    .uniForegroundStyle(.secondary)
            }
            Spacer()
            Text(record.createdAt, style: .relative)
                .font(.caption2)
                .uniForegroundStyle(.secondary)
        }
        .accessibilityElement(children: .combine)
    }
}
