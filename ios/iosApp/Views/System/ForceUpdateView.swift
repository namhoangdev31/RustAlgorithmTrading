import SwiftUI
import AdaptiveSwiftUi

import AdaptiveSwiftUi

struct ForceUpdateView: View {
    var onUpdate: () -> Void
    
    var body: some View {
        VStack(spacing: 24) {
            Image(systemName: "arrow.triangle.2.circlepath.circle.fill")
                .font(.system(size: 64))
                .adaptiveForegroundStyle(.blue)
            
            VStack(spacing: 8) {
                Text("Update Required")
                    .font(.title2)
                    .fontWeight(.bold)
                
                Text("A new version of LeposApp is available. Please update to continue using the app.")
                    .font(.body)
                    .adaptiveForegroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }
            
            AdaptiveButton(action: onUpdate) {
                Text("Update Now")
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
        .adaptiveInteractiveDismissDisabled()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(UIColor.systemBackground))
    }
}

#Preview {
    ForceUpdateView(onUpdate: {})
}
