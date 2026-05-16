import SwiftUI
import AdaptiveSwiftUi

// import Shared — replaced by native Swift Shared module

struct MiniAppInformationView: View {
    // UI-only
    
    var body: some View {
        VStack(alignment: .leading, spacing: 15) {
            Text("Information")
                .font(.title2)
                .fontWeight(.bold)
            
            VStack(spacing: 0) {
                InfoRow(label: "Developer", value: "GreenLogic Labs LLC")
                AdaptiveDivider().padding(.leading, 16)
                InfoRow(label: "Size", value: "42.8 MB")
                AdaptiveDivider().padding(.leading, 16)
                InfoRow(label: "Category", value: "Productivity")
                AdaptiveDivider().padding(.leading, 16)
                InfoRow(label: "Compatibility", value: "Works on this iPhone", isLink: true)
                AdaptiveDivider().padding(.leading, 16)
                InfoRow(label: "Languages", value: "English and 12 more")
                AdaptiveDivider().padding(.leading, 16)
                InfoRow(label: "Age Rating", value: "4+")
            }
        }
        .padding()
    }
}

struct InfoRow: View {
    let label: String
    let value: String
    var isLink: Bool = false
    
    var body: some View {
        HStack {
            Text(label)
                .font(.body)
                .adaptiveForegroundStyle(.secondary)
            Spacer()
            if isLink {
                HStack(spacing: 4) {
                    Text(value)
                        .font(.body)
                        .adaptiveForegroundStyle(.blue)
                    Image(systemName: "chevron.down")
                        .font(.caption)
                        .adaptiveForegroundStyle(.blue)
                }
            } else {
                Text(value)
                    .font(.body)
                    .foregroundColor(.primary)
            }
        }
        .padding(.vertical, 12)
    }
}
