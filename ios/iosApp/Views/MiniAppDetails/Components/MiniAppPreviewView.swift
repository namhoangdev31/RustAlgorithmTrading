import SwiftUI
import AdaptiveSwiftUi


struct MiniAppPreviewView: View {
    var body: some View {
        VStack(alignment: .leading) {
            Text("Preview")
                .font(.title2)
                .fontWeight(.bold)
                .padding(.horizontal)
            
            AdaptiveScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 16) {
                    ForEach(0..<3) { i in
                        // Phone Frame Mockup
                        ZStack {
                            RoundedRectangle(cornerRadius: 38)
                                .stroke(Color.gray.opacity(0.3), lineWidth: 4)
                                .background(Color.white)
                                .clipShape(RoundedRectangle(cornerRadius: 38))
                                .frame(width: 250, height: 500)
                                .shadow(color: .black.opacity(0.05), radius: 10, x: 5, y: 5)
                            
                            // Screen Content
                            RoundedRectangle(cornerRadius: 34)
                                .fill(Color.gray.opacity(0.1))
                                .frame(width: 242, height: 492)
                                .overlay(
                                    VStack {
                                        Text("Screen \(i+1)")
                                            .font(.headline)
                                            .adaptiveForegroundStyle(.secondary)
                                    }
                                )
                            
                            // Notch/Island area
                            VStack {
                                Capsule()
                                    .fill(Color.black)
                                    .frame(width: 80, height: 25)
                                    .padding(.top, 10)
                                Spacer()
                            }
                            .frame(width: 250, height: 500)
                            
                            // Home indicator
                            VStack {
                                Spacer()
                                Capsule()
                                    .fill(Color.gray.opacity(0.5))
                                    .frame(width: 100, height: 4)
                                    .padding(.bottom, 10)
                            }
                            .frame(width: 250, height: 500)
                        }
                    }
                }
                .padding(.horizontal)
                .padding(.vertical, 20) // Space for shadow
            }
        }
    }
}
