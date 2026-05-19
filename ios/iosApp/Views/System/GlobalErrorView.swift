import ExploreSwiftUI
import SwiftUI

struct GlobalErrorView: View {
    var onRetry: () -> Void

    var body: some View {
        VStack(spacing: 24) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 64))
                .uniForegroundStyle(.orange)

            VStack(spacing: 8) {
                Text("Something went wrong")
                    .font(.title2)
                    .fontWeight(.bold)

                Text("We encountered an unexpected error. Please try again later.")
                    .font(.body)
                    .uniForegroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }

            UniButton(action: onRetry) {
                Text("Retry")
                    .font(.headline)
                    .uniForegroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .cornerRadius(12)
            }
            .uniButtonStyle(.plain)
            .padding(.horizontal, 32)
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(UIColor.systemBackground))
    }
}

#Preview {
    GlobalErrorView(onRetry: {})
}
