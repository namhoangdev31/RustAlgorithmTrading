import SwiftUI
import AdaptiveSwiftUi


struct NoInternetView: View {
    var onRetry: () -> Void
    
    var body: some View {
        VStack(spacing: 24) {
            Image(systemName: "wifi.slash")
                .font(.system(size: 64))
                .adaptiveForegroundStyle(.secondary)
            
            VStack(spacing: 8) {
                Text("No Internet Connection")
                    .font(.title2)
                    .fontWeight(.bold)
                
                Text("Please check your connection and try again.")
                    .font(.body)
                    .adaptiveForegroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }
            
            AdaptiveButton(action: onRetry) {
                Text("Try Again")
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
    NoInternetView(onRetry: {})
}
