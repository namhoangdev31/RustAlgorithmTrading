import ExploreSwiftUI
import SwiftUI

struct NotificationInboxView: View {
    @EnvironmentObject private var navigation: NavigationViewModel

    // Mock Data
    struct NotificationItem: Identifiable, Hashable {
        let id: UUID
        let title: String
        let message: String
        let time: String
        let isRead: Bool
        let type: String  // "update", "promo", "system"

        init(id: UUID = UUID(), title: String, message: String, time: String, isRead: Bool, type: String) {
            self.id = id
            self.title = title
            self.message = message
            self.time = time
            self.isRead = isRead
            self.type = type
        }
    }

    static let mockNotifications = [
        NotificationItem(
            title: "New Update Available",
            message: "LepoStar v2.1 is now available with dark mode support.", time: "2h ago",
            isRead: false, type: "update"),
        NotificationItem(
            title: "Welcome to LepoStar!",
            message: "Thanks for joining our community. Check out our getting started guide.",
            time: "1d ago", isRead: true, type: "system"),
        NotificationItem(
            title: "Sale Ends Soon", message: "50% off on all pro subscriptions. Don't miss out!",
            time: "2d ago", isRead: true, type: "promo"),
        NotificationItem(
            title: "Security Alert", message: "New login detected from Mac Device.", time: "3d ago",
            isRead: true, type: "system"),
    ]

    var body: some View {
        UniList {
            ForEach(Self.mockNotifications) { item in
                UniButton(action: {
                    navigation.navigate(to: .notificationDetail(id: item.id.uuidString))
                }) {
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
                                .uniForegroundStyle(.primary)

                            Text(item.message)
                                .font(.subheadline)
                                .uniForegroundStyle(.secondary)
                                .lineLimit(2)

                            Text(item.time)
                                .font(.caption)
                                .uniForegroundStyle(.secondary)
                                .padding(.top, 2)
                        }

                        Spacer()

                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .uniForegroundStyle(.secondary)
                            .padding(.top, 4)
                    }
                    .padding(.vertical, 4)
                }
                .uniButtonStyle(.plain)
            }
        }
        .uniListStyle(.plain)
        .navigationTitle("Notifications")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                UniButton("Mark all as read") {
                    // Action
                }
                .uniButtonStyle(.plain)
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
    UniNavigationStack {
        NotificationInboxView()
    }
}
