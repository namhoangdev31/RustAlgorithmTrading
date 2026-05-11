import SwiftUI

struct LifestyleView: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Lifestyle")
                    .font(.headline)
                Spacer()
                Button("See All") { }
                    .font(.caption)
                    .foregroundColor(.blue)
            }
            .padding(.horizontal)
            
            HStack(spacing: 16) {
                // Large Card 1
                LifestyleCard(
                    title: "Health\nConnect",
                    subtitle: "8,420 Steps",
                    icon: "scalemass.fill", // Placeholder for dumbbell/scale
                    color: Color.pink
                )
                
                // Large Card 2
                LifestyleCard(
                    title: "Audio\nCloud",
                    subtitle: "Deep House Mix",
                    icon: "music.note",
                    color: Color.indigo
                )
            }
            .padding(.horizontal)
        }
    }
}

struct LifestyleCard: View {
    let title: String
    let subtitle: String
    let icon: String
    let color: Color
    
    var body: some View {
        RoundedRectangle(cornerRadius: 24)
            .fill(color.opacity(0.05))
            .overlay(
                VStack(alignment: .leading) {
                    Circle()
                        .fill(Color.white)
                        .frame(width: 50, height: 50)
                        .overlay(
                            Image(systemName: icon)
                                .font(.title2)
                                .foregroundColor(color)
                        )
                    
                    Spacer()
                    
                    Text(title)
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(color)
                    
                    Text(subtitle)
                        .font(.caption)
                        .foregroundColor(color.opacity(0.6))
                        .padding(.top, 2)
                }
                .padding(20)
                .frame(maxWidth: .infinity, alignment: .leading)
            )
            .frame(height: 200)
    }
}
