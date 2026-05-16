import SwiftUI
import AdaptiveSwiftUi


struct NotificationDetailView: View {
    let notification: NotificationInboxView.NotificationItem
    
    var body: some View {
        AdaptiveScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text(notification.time)
                    .font(.subheadline)
                    .adaptiveForegroundStyle(.secondary)
                
                Text(notification.title)
                    .font(.title)
                    .fontWeight(.bold)
                
                Text(notification.message)
                    .font(.body)
                    .lineSpacing(6)
                
                if notification.type == "update" {
                    AdaptiveButton(action: {
                        // Update action
                    }) {
                        Text("Update Now")
                            .font(.headline)
                            .adaptiveForegroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.blue)
                            .cornerRadius(12)
                    }
                    .adaptiveButtonStyle(.plain)
                    .padding(.top, 24)
                }
            }
            .padding()
        }
        .navigationTitle("Detail")
        .navigationBarTitleDisplayMode(.inline)
    }
}

#Preview {
    NavigationView {
        NotificationDetailView(notification: NotificationInboxView.NotificationItem(title: "Test", message: "Test Message", time: "Now", isRead: false, type: "update"))
    }
}
