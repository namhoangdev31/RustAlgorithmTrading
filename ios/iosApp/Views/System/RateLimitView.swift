import ExploreSwiftUI
import SwiftUI

struct RateLimitView: View {
    var onRetry: () -> Void

    var body: some View {
        VStack(spacing: 24) {
            Image(systemName: "hand.raised.fill")
                .font(.system(size: 64))
                .uniForegroundStyle(.red)

            VStack(spacing: 8) {
                Text("Too Many Requests")
                    .font(.title2)
                    .uniBold()

                Text("Please slow down. You've made too many requests recently.")
                    .font(.body)
                    .uniForegroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }

            UniButton(action: onRetry) {
                Text("Try Again")
                    .font(.headline)
                    .uniForegroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .uniButtonStyle(.plain)
            .padding(.horizontal, 32)
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.leposBackground)
    }
}

#Preview {
    RateLimitView(onRetry: {})
}
