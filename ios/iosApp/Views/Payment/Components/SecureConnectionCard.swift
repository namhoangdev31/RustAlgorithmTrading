import SwiftUI
import AdaptiveSwiftUi


struct SecureConnectionCard: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "shield.fill")
                .font(.system(size: 40))
                .adaptiveForegroundStyle(.blue)
                .padding(20)
                .background(Color.blue.opacity(0.1))
                .clipShape(Circle())
            
            Text("Secure Connection")
                .font(.headline)
            
            Text("Your financial data is protected\nwith industry-leading encryption\nprotocols.")
                .font(.subheadline)
                .adaptiveForegroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(32)
        .frame(maxWidth: .infinity)
        .adaptiveGlass(cornerRadius: 32)
        .padding(.horizontal)
    }
}
