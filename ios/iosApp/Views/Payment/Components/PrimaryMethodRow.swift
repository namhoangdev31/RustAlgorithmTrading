import SwiftUI
import AdaptiveSwiftUi


struct PrimaryMethodRow: View {
    let method: PaymentMethod
    
    var body: some View {
        ZStack(alignment: .topTrailing) {
            // Card Content
            HStack(spacing: 16) {
                ZStack {
                    RoundedRectangle(cornerRadius: 16)
                        .fill(Color.black)
                        .frame(width: 56, height: 56)
                    
                    Image(systemName: "apple.logo")
                        .font(.system(size: 26))
                        .adaptiveForegroundStyle(.white)
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    Text("Apple Pay")
                        .font(.system(size: 18, weight: .bold))
                        .adaptiveForegroundStyle(.primary)
                    Text("MacBook Pro & iPhone")
                        .font(.system(size: 14))
                        .adaptiveForegroundStyle(.secondary)
                }
                Spacer()
            }
            .padding(24)
            .adaptiveGlass(cornerRadius: 28)
            
            // Badge & Edit
            VStack(alignment: .trailing, spacing: 0) {
                 HStack(spacing: 4) {
                    Image(systemName: "checkmark.seal.fill")
                        .font(.system(size: 10))
                    Text("DEFAULT")
                        .font(.system(size: 10, weight: .bold))
                }
                .adaptiveForegroundStyle(.cyan)
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(Color.cyan.opacity(0.1))
                .clipShape(Capsule())
                .padding(.top, 20)
                .padding(.trailing, 20)
                
                Spacer()
                
                AdaptiveButton(action: {}) {
                     Text("Edit")
                        .font(.system(size: 15, weight: .bold))
                        .adaptiveForegroundStyle(.cyan)
                }
                .adaptiveButtonStyle(.plain)
                .padding(.bottom, 24)
                .padding(.trailing, 24)
            }
        }
        .padding(.horizontal)
        .frame(height: 100) // Ensure enough height for the ZStack alignment to work nicely
    }
}
