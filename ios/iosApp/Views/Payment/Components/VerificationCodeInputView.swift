import SwiftUI
import AdaptiveSwiftUi

struct VerificationCodeInputView: View {
    let pin: String
    
    var body: some View {
        VStack(spacing: 24) {
            // Instruction Card
            HStack(spacing: 16) {
                Image(systemName: "bubble.left.and.bubble.right.fill")
                    .font(.system(size: 24))
                    .adaptiveForegroundStyle(.cyan)
                    .frame(width: 56, height: 56)
                    .background(Color.cyan.opacity(0.1))
                    .clipShape(Circle())
                
                VStack(alignment: .leading, spacing: 4) {
                    Text("Enter 6-digit code")
                        .font(.headline)
                        .fontWeight(.medium)
                    Text("We've sent a verification code to \nyour registered mobile number +84 \n**** 1234")
                        .font(.caption)
                        .adaptiveForegroundStyle(.secondary)
                        .lineSpacing(4)
                }
            }
            .padding(24)
            .frame(maxWidth: .infinity, alignment: .leading)
            .adaptiveGlass(cornerRadius: 32)
            .padding(.horizontal)
            
            // PIN Entry Fields
            HStack(spacing: 12) {
                ForEach(0..<6, id: \.self) { index in
                    Circle()
                        .fill(index < pin.count ? Color.primary : Color.white)
                        .frame(width: 16, height: 16)
                        .overlay(
                            Circle()
                                .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                        )
                        .frame(width: 48, height: 48)
                        .background(Color.white)
                        .clipShape(Circle())
                        .shadow(color: .black.opacity(0.05), radius: 2, x: 0, y: 1)
                }
            }
            .padding(.horizontal)
        }
    }
}
