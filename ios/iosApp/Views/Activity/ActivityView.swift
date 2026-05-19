import ExploreSwiftUI
import SwiftUI

struct ActivityView: View {
    @Environment(\.dismiss) var dismiss

    @State private var selectedFilter = "All"
    @State private var animateBell = false
    let filters = ["All", "Unread", "Mentions", "System"]

    var body: some View {
        UniScrollView {
            VStack(alignment: .leading, spacing: 16) {
                // Filters
                UniScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        ForEach(filters, id: \.self) { filter in
                            UniButton(action: {
                                selectedFilter = filter
                            }) {
                                Text(filter)
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 8)
                                    .background(
                                        selectedFilter == filter ? Color.blue : Color(.systemGray5)
                                    )
                                    .uniForegroundStyle(
                                        selectedFilter == filter ? .white : .primary
                                    )
                                    .cornerRadius(20)
                            }
                        }
                    }
                    .padding(.horizontal)
                }
                .padding(.top, 8)

                // Section: Last 24 Hours
                ActivitySectionHeaderView(title: "Last 24 Hours")

                SystemActivityCardView(isUnread: true)

                MiniAppActivityCardView(
                    appName: "Food Dash",
                    description: "Your lunch is arriving in 5 mins.",
                    timeAgo: "12m ago",
                    iconColor: .green,
                    actionTitle: "TRACK",
                    isUnread: true
                )

                MiniAppActivityCardView(
                    appName: "Fitness Hub",
                    description: "5-day activity streak reached!",
                    timeAgo: "2h ago",
                    iconColor: .mint,
                    actionTitle: "VIEW",
                    isUnread: true
                )

                // Section: Earlier
                ActivitySectionHeaderView(title: "Earlier")

                // Alternate System Card Style (Dark) with Uni Glass
                ZStack {
                    Color.black.opacity(0.9)

                    VStack(alignment: .leading, spacing: 8) {
                        Text("SYSTEM SECURITY")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .uniForegroundStyle(.white, hierarchy: .secondary)

                        Text("Review Login Attempt.")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(.white)

                        Spacer()

                        Text("We noticed a login from an recognized device in New York, US.")
                            .font(.subheadline)
                            .uniForegroundStyle(.white, hierarchy: .secondary)

                        HStack {
                            Spacer()
                            UniButton(action: {}) {
                                Text("REVIEW")
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 8)
                                    .background(Color.white.opacity(0.2))
                                    .foregroundColor(.white)
                                    .cornerRadius(16)
                            }
                        }
                    }
                    .padding(24)
                }
                .frame(height: 280)
                .uniGlassEffect()
                .cornerRadius(20)
                .shadow(color: Color.black.opacity(0.1), radius: 10, x: 0, y: 5)
                .padding(.horizontal)

                MiniAppActivityCardView(
                    appName: "Cloud Sync",
                    description: "Backup for 4 mini-apps complete.",
                    timeAgo: "Yesterday",
                    iconColor: .blue.opacity(0.5),
                    actionTitle: "OPEN",
                    isUnread: false
                )

                Spacer(minLength: 40)
            }
        }
        .uniNavigationTitle("Activity")
        .toolbar {
            ToolbarItemGroup(placement: .primaryAction) {
                UniButton("Up", systemImage: "checkmark.circle.fill", action: {})
                    .uniButtonTint(.blue)
                UniToolbarSpacer(.fixed, fallbackLength: 8)  // Hoạt động như một View
                UniButton(action: {
                    animateBell.toggle()
                }) {
                    Image(systemName: "bell.badge.fill")
                        .uniSymbolEffect(.bounce, isActive: animateBell)
                }
                .uniButtonTint(.blue)
            }
        }
    }
}
