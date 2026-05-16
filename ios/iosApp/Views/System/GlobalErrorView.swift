import SwiftUI
import AdaptiveSwiftUi


struct GlobalErrorView: View {
    var onRetry: () -> Void
    
    var body: some View {
        VStack(spacing: 24) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 64))
                .adaptiveForegroundStyle(.orange)
            
            VStack(spacing: 8) {
                Text("Something went wrong")
                    .font(.title2)
                    .fontWeight(.bold)
                
                Text("We encountered an unexpected error. Please try again later.")
                    .font(.body)
                    .adaptiveForegroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }
            
            AdaptiveButton(action: onRetry) {
                Text("Retry")
                    .font(.headline)
                    .adaptiveForegroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .cornerRadius(12)
            }
            .adaptiveButtonStyle(.plain)
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
