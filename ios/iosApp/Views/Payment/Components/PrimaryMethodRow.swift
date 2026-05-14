import SwiftUI

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
                        .foregroundColor(.white)
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    Text("Apple Pay")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundColor(.black)
                    Text("MacBook Pro & iPhone")
                        .font(.system(size: 14))
                        .foregroundColor(.secondary)
                }
                Spacer()
            }
            .padding(24)
            .background(Color.white)
            .cornerRadius(28)
            .shadow(color: .black.opacity(0.06), radius: 12, x: 0, y: 4)
            
            // Badge & Edit
            VStack(alignment: .trailing, spacing: 0) {
                 HStack(spacing: 4) {
                    Image(systemName: "checkmark.seal.fill")
                        .font(.system(size: 10))
                    Text("DEFAULT")
                        .font(.system(size: 10, weight: .bold))
                }
                .foregroundColor(.cyan)
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(Color.cyan.opacity(0.1))
                .clipShape(Capsule())
                .padding(.top, 20)
                .padding(.trailing, 20)
                
                Spacer()
                
                Button(action: {}) {
                     Text("Edit")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(.cyan)
                }
                .padding(.bottom, 24)
                .padding(.trailing, 24)
            }
        }
        .padding(.horizontal)
        .frame(height: 100) // Ensure enough height for the ZStack alignment to work nicely
    }
}
