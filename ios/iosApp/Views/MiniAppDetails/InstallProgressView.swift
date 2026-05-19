import ExploreSwiftUI
import SwiftUI

struct InstallProgressView: View {
    let appId: String
    @State private var progress: Double = 0.0
    @State private var status: String = "Waiting..."
    @Environment(\.presentationMode) var presentationMode

    var body: some View {
        VStack(spacing: 24) {
            // App Icon Placeholder
            Rectangle()
                .fill(Color.gray.opacity(0.2))
                .frame(width: 80, height: 80)
                .cornerRadius(16)
                .overlay(
                    Image(systemName: "app.dashed")
                        .font(.largeTitle)
                        .uniForegroundStyle(.secondary)
                )

            VStack(spacing: 8) {
                Text("Installing App")
                    .font(.title3)
                    .fontWeight(.bold)

                Text(status)
                    .font(.body)
                    .uniForegroundStyle(.secondary)
            }

            VStack(spacing: 8) {
                UniProgressView(value: progress)

                HStack {
                    Text("\(Int(progress * 100))%")
                    Spacer()
                    Text("24MB / 48MB")
                }
                .font(.caption)
                .uniForegroundStyle(.secondary)
            }
            .padding(.horizontal)

            UniButton(action: {
                // Cancel action
                presentationMode.wrappedValue.dismiss()
            }) {
                Text("Cancel")
                    .fontWeight(.medium)
                    .uniForegroundStyle(.red)
            }
            .uniButtonStyle(.plain)
            .padding(.top)
        }
        .padding(32)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(UIColor.systemBackground))
        .onAppear {
            // Simulate progress
            withAnimation(.linear(duration: 2.0)) {
                progress = 0.45
                status = "Downloading..."
            }
        }
    }
}

#Preview {
    InstallProgressView(appId: "preview")
}
