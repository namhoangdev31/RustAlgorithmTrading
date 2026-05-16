import SwiftUI
import AdaptiveSwiftUi


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
                        .adaptiveForegroundStyle(.secondary)
                )
            
            VStack(spacing: 8) {
                Text("Installing App")
                    .font(.title3)
                    .fontWeight(.bold)
                
                Text(status)
                    .font(.body)
                    .adaptiveForegroundStyle(.secondary)
            }
            
            VStack(spacing: 8) {
                AdaptiveProgressView(value: progress)
                
                HStack {
                    Text("\(Int(progress * 100))%")
                    Spacer()
                    Text("24MB / 48MB")
                }
                .font(.caption)
                .adaptiveForegroundStyle(.secondary)
            }
            .padding(.horizontal)
            
            AdaptiveButton(action: {
                // Cancel action
                presentationMode.wrappedValue.dismiss()
            }) {
                Text("Cancel")
                    .fontWeight(.medium)
                    .adaptiveForegroundStyle(.red)
            }
            .adaptiveButtonStyle(.plain)
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
