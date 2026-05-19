import ExploreSwiftUI
import SwiftUI

struct SecureConnectionCard: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "shield.fill")
                .font(.system(size: 40))
                .uniForegroundStyle(.blue)
                .padding(20)
                .background(Color.blue.opacity(0.1))
                .clipShape(Circle())

            Text("Secure Connection")
                .font(.headline)

            Text("Your financial data is protected\nwith industry-leading encryption\nprotocols.")
                .font(.subheadline)
                .uniForegroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(32)
        .frame(maxWidth: .infinity)
        .uniGlass(cornerRadius: 32)
        .padding(.horizontal)
    }
}
