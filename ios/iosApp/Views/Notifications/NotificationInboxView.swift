import SwiftUI

struct NotificationInboxView: View {
    // Mock Data
    struct NotificationItem: Identifiable {
        let id = UUID()
        let title: String
        let message: String
        let time: String
        let isRead: Bool
        let type: String // "update", "promo", "system"
    }
    
    let notifications = [
        NotificationItem(title: "New Update Available", message: "LeposApp v2.1 is now available with dark mode support.", time: "2h ago", isRead: false, type: "update"),
        NotificationItem(title: "Welcome to LeposApp!", message: "Thanks for joining our community. Check out our getting started guide.", time: "1d ago", isRead: true, type: "system"),
        NotificationItem(title: "Sale Ends Soon", message: "50% off on all pro subscriptions. Don't miss out!", time: "2d ago", isRead: true, type: "promo"),
        NotificationItem(title: "Security Alert", message: "New login detected from Mac Device.", time: "3d ago", isRead: true, type: "system")
    ]
    
    var body: some View {
        List {
            ForEach(notifications) { item in
                NavigationLink(destination: NotificationDetailView(notification: item)) {
                    HStack(alignment: .top, spacing: 12) {
                        Circle()
                            .fill(iconColor(for: item.type))
                            .frame(width: 10, height: 10)
                            .opacity(item.isRead ? 0 : 1)
                            .padding(.top, 6)
                        
                        VStack(alignment: .leading, spacing: 4) {
                            Text(item.title)
                                .font(.headline)
                                .fontWeight(item.isRead ? .regular : .bold)
                            
                            Text(item.message)
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                                .lineLimit(2)
                            
                            Text(item.time)
                                .font(.caption)
                                .foregroundColor(.gray)
                                .padding(.top, 2)
                        }
                    }
                    .padding(.vertical, 4)
                }
            }
        }
        .listStyle(PlainListStyle())
        .navigationTitle("Notifications")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Mark all as read") {
                    // Action
                }
            }
        }
    }
    
    func iconColor(for type: String) -> Color {
        switch type {
        case "update": return .blue
        case "promo": return .orange
        case "system": return .red
        default: return .gray
        }
    }
}

#Preview {
    NavigationView {
        NotificationInboxView()
    }
}
