import SwiftUI
import AdaptiveSwiftUi

struct SystemActivityCardView: View {
    var isUnread: Bool = true
    
    var body: some View {
        HStack(spacing: 0) {
            // Left indicator line for System cards
            if isUnread {
                Rectangle()
                    .fill(Color.blue)
                    .frame(width: 4)
            }
            
            ZStack {
                // Deep Gradient Background
                LinearGradient(
                    gradient: Gradient(colors: [Color.blue, Color.purple]),
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                
                AdaptiveGlassEffectContainer(spacing: 8) {
                    Text("SYSTEM")
                        .font(.caption2)
                        .fontWeight(.bold)
                        .adaptiveForegroundStyle(.white, hierarchy: .secondary)
                    
                    Text("V2.4.1 is ready for installation.")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                        .fixedSize(horizontal: false, vertical: true)
                    
                    Spacer()
                    
                    Text("Experience 40% faster loading speeds and new visual themes across all apps.")
                        .font(.subheadline)
                        .adaptiveForegroundStyle(.white, hierarchy: .secondary)
                        .lineLimit(3)
                        .fixedSize(horizontal: false, vertical: true)
                    
                    HStack {
                        Spacer()
                        AdaptiveButton(action: {}) {
                            Text("UPDATE")
                                .font(.caption)
                                .fontWeight(.bold)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 8)
                                .background(Color.white.opacity(0.2))
                                .foregroundColor(.white)
                                .cornerRadius(16)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 16)
                                        .stroke(Color.white.opacity(0.3), lineWidth: 1)
                                )
                        }
                    }
                }
                .padding(20)
            }
        }
        .frame(height: 320)
        .cornerRadius(20)
        .shadow(color: Color.black.opacity(0.1), radius: 10, x: 0, y: 5)
        .padding(.horizontal)
    }
}
