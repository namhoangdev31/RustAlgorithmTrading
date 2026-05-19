import ExploreSwiftUI
import SwiftUI

struct NotificationDetailView: View {
    let notification: NotificationInboxView.NotificationItem

    var body: some View {
        UniScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text(notification.time)
                    .font(.subheadline)
                    .uniForegroundStyle(.secondary)

                Text(notification.title)
                    .font(.title)
                    .fontWeight(.bold)

                Text(notification.message)
                    .font(.body)
                    .lineSpacing(6)

                if notification.type == "update" {
                    UniButton(action: {
                        // Update action
                    }) {
                        Text("Update Now")
                            .font(.headline)
                            .uniForegroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.blue)
                            .cornerRadius(12)
                    }
                    .uniButtonStyle(.plain)
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
        NotificationDetailView(
            notification: NotificationInboxView.NotificationItem(
                title: "Test", message: "Test Message", time: "Now", isRead: false, type: "update"))
    }
}
