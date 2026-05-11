import SwiftUI

struct ScannerOverlayView: View {
    var onScan: () -> Void
    var onEnterManually: () -> Void
    
    var body: some View {
        VStack(spacing: 20) {
            ZStack {
                RoundedRectangle(cornerRadius: 24)
                    .fill(Color(red: 20/255, green: 25/255, blue: 35/255)) // Dark Navy
                    .frame(height: 200)
                
                // Scanner Frame
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.cyan, lineWidth: 2)
                    .frame(height: 140)
                    .padding(.horizontal, 40)
                    .overlay(
                        // Scan Line
                        Rectangle()
                            .fill(LinearGradient(gradient: Gradient(colors: [.clear, .cyan.opacity(0.5), .clear]), startPoint: .leading, endPoint: .trailing))
                            .frame(height: 1)
                    )
                
                Text("ALIGN CARD WITH FRAME")
                    .font(.caption2)
                    .fontWeight(.bold)
                    .foregroundColor(.white.opacity(0.6))
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Color.black.opacity(0.3))
                    .cornerRadius(12)
                    .offset(y: 60)
            }
            .shadow(color: .black.opacity(0.2), radius: 10, x: 0, y: 5)
            
            // Action Buttons
            VStack(spacing: 12) {
                Button(action: onScan) {
                    HStack {
                        Image(systemName: "camera.fill")
                        Text("Scan Card")
                            .fontWeight(.bold)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.cyan)
                    .foregroundColor(.white)
                    .cornerRadius(16)
                    .shadow(color: .cyan.opacity(0.3), radius: 10, x: 0, y: 5)
                }
                
                Button(action: onEnterManually) {
                    Text("Enter Manually")
                        .fontWeight(.medium)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.white)
                        .foregroundColor(.primary)
                        .cornerRadius(16)
                        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
                }
            }
        }
        .padding(.horizontal)
    }
}
