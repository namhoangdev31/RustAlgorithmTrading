import ExploreSwiftUI
import SwiftUI

struct OnboardingView: View {
    @Binding var isCompleted: Bool
    @State private var currentPage = 0

    let pages = [
        (
            image: "sparkles", title: "Welcome to Lepos",
            description: "Discover a world of mini-apps and seamless experiences."
        ),
        (
            image: "square.grid.2x2", title: "Instant Apps",
            description: "Use apps instantly without downloading. Fast, secure, and lightweight."
        ),
        (
            image: "shield.checkerboard", title: "Safe & Secure",
            description: "Your privacy is our priority. Enjoy a secure ecosystem."
        ),
    ]

    var body: some View {
        VStack {
            TabView(selection: $currentPage) {
                ForEach(0..<pages.count, id: \.self) { index in
                    OnboardingPage(
                        image: pages[index].image,
                        title: pages[index].title,
                        description: pages[index].description
                    )
                    .tag(index)
                }
            }
            .uniTabViewStyle(.page(indexDisplayMode: .always))
            .indexViewStyle(PageIndexViewStyle(backgroundDisplayMode: .always))

            UniButton(action: {
                if currentPage < pages.count - 1 {
                    withAnimation {
                        currentPage += 1
                    }
                } else {
                    withAnimation {
                        isCompleted = true
                    }
                }
            }) {
                Text(currentPage < pages.count - 1 ? "Next" : "Get Started")
                    .font(.headline)
                    .uniForegroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .cornerRadius(12)
            }
            .uniButtonStyle(.plain)
            .padding(.horizontal, 24)
            .padding(.bottom, 16)
        }
    }
}
