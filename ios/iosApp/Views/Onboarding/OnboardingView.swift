import SwiftUI
import AdaptiveSwiftUi

struct OnboardingView: View {
    @Binding var isCompleted: Bool
    @State private var currentPage = 0
    
    let pages = [
        (image: "sparkles", title: "Welcome to Lepos", description: "Discover a world of mini-apps and seamless experiences."),
        (image: "square.grid.2x2", title: "Instant Apps", description: "Use apps instantly without downloading. Fast, secure, and lightweight."),
        (image: "shield.checkerboard", title: "Safe & Secure", description: "Your privacy is our priority. Enjoy a secure ecosystem.")
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
            .adaptiveTabViewStyle(.page(indexDisplayMode: .always))
            .indexViewStyle(PageIndexViewStyle(backgroundDisplayMode: .always))
            
            AdaptiveButton(action: {
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
                    .adaptiveForegroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .cornerRadius(12)
            }
            .adaptiveButtonStyle(.plain)
            .padding(.horizontal, 24)
            .padding(.bottom, 16)
        }
    }
}
