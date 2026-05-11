import SwiftUI

struct AppShortcut: Identifiable {
    let id = UUID()
    let name: String
    let icon: String
    let color: Color
    let isAdd: Bool
}

struct FavoriteMiniAppsView: View {
    let shortcuts = [
        AppShortcut(name: "Foodie", icon: "fork.knife", color: .orange, isAdd: false),
        AppShortcut(name: "Ride", icon: "car.fill", color: .blue, isAdd: false),
        AppShortcut(name: "Cinema", icon: "popcorn.fill", color: .purple, isAdd: false),
        AppShortcut(name: "Add", icon: "plus", color: .gray, isAdd: true)
    ]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("FAVORITE MINI APPS")
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundColor(.gray)
                    .tracking(1)
                
                Spacer()
                
                Image(systemName: "square.grid.2x2")
                    .foregroundColor(.gray)
            }
            .padding(.horizontal)
            
            HStack(spacing: 0) {
                ForEach(shortcuts) { app in
                    VStack(spacing: 8) {
                        ZStack {
                            Circle()
                                .fill(app.isAdd ? Color(.systemGray6) : app.color.opacity(0.1))
                                .frame(width: 60, height: 60)
                            
                            Image(systemName: app.icon)
                                .font(.title3)
                                .foregroundColor(app.isAdd ? .gray : app.color)
                        }
                        
                        Text(app.name)
                            .font(.caption)
                            .foregroundColor(.gray)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            .padding(.horizontal, 8)
        }
    }
}
