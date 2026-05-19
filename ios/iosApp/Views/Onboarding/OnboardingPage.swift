import ExploreSwiftUI
import SwiftUI

struct OnboardingPage: View {
    let image: String
    let title: String
    let description: String

    var body: some View {
        VStack(spacing: 24) {
            Image(systemName: image)
                .resizable()
                .scaledToFit()
                .frame(height: 200)
                .uniForegroundStyle(.blue)
                .padding(.bottom, 32)

            Text(title)
                .font(.largeTitle)
                .fontWeight(.bold)
                .multilineTextAlignment(.center)

            Text(description)
                .font(.body)
                .multilineTextAlignment(.center)
                .uniForegroundStyle(.secondary)
                .padding(.horizontal, 32)
        }
        .padding()
    }
}
