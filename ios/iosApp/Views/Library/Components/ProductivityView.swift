import SwiftUI

struct ProductivityView: View {
    let apps = [
        ("Smart Calendar", "calendar", Color.blue, "Last used 5m ago • 3 events"),
        ("Editor Pro", "doc.text.fill", Color.orange, "Last used 12m ago • Syncing"),
        ("Tasks & Flow", "checkmark.circle", Color.green, "Last used 2h ago • 8 pending")
    ]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Productivity")
                    .font(.headline)
                Spacer()
                Button("See All") { }
                    .font(.caption)
                    .foregroundColor(.blue)
            }
            .padding(.horizontal)
            
            VStack(spacing: 12) {
                ForEach(apps, id: \.0) { app in
                    HStack(spacing: 16) {
                        RoundedRectangle(cornerRadius: 12)
                            .fill(app.2.opacity(0.1))
                            .frame(width: 50, height: 50)
                            .overlay(
                                Image(systemName: app.1)
                                    .font(.title2)
                                    .foregroundColor(app.2)
                            )
                        
                        VStack(alignment: .leading, spacing: 4) {
                            Text(app.0)
                                .font(.subheadline)
                                .fontWeight(.bold)
                            Text(app.3)
                                .font(.caption2)
                                .foregroundColor(.gray)
                        }
                        
                        Spacer()
                        
                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .foregroundColor(.gray.opacity(0.5))
                    }
                    .padding()
                    .background(Color.white) // Or appropriate background color
                    .clipShape(RoundedRectangle(cornerRadius: 20))
                    .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
                    .padding(.horizontal)
                }
            }
        }
    }
}
