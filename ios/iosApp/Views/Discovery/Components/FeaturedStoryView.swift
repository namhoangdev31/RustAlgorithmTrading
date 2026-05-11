import SwiftUI

struct FeaturedStoryView: View {
    var body: some View {
        VStack(alignment: .leading) {
            ZStack(alignment: .bottom) {
                // Background Image Placeholder
                RoundedRectangle(cornerRadius: 20)
                    .fill(LinearGradient(colors: [Color.green.opacity(0.3), Color.black.opacity(0.6)], startPoint: .topLeading, endPoint: .bottom))
                    .frame(height: 450)
                
                VStack(alignment: .leading, spacing: 10) {
                    Spacer()
                    
                    Text("FEATURED STORY")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.white.opacity(0.8))
                    
                    Text("Elevate Your\nMorning Ritual")
                        .font(.largeTitle)
                        .fontWeight(.heavy)
                        .foregroundColor(.white)
                        .lineLimit(2)
                    
                    Spacer().frame(height: 20)
                    
                    HStack {
                        RoundedRectangle(cornerRadius: 12)
                            .fill(Color.gray.opacity(0.5))
                            .frame(width: 40, height: 40)
                            .overlay(Image(systemName: "waveform").foregroundColor(.white))
                        
                        VStack(alignment: .leading) {
                            Text("Z-Gym Pro")
                                .font(.headline)
                                .foregroundColor(.white)
                            Text("AI Fitness Coaching")
                                .font(.caption)
                                .foregroundColor(.white.opacity(0.8))
                        }
                        
                        Spacer()
                        
                        Button(action: {}) {
                            Text("GET")
                                .font(.subheadline)
                                .fontWeight(.bold)
                                .foregroundColor(.black)
                                .padding(.horizontal, 24)
                                .padding(.vertical, 8)
                                .background(Color.white)
                                .clipShape(Capsule())
                        }
                    }
                    .padding(12)
                    .background(Color.black.opacity(0.3))
                    .cornerRadius(16)
                }
                .padding(24)
            }
            .padding(.horizontal)
            .shadow(color: Color.black.opacity(0.2), radius: 10, x: 0, y: 5)
        }
    }
}
