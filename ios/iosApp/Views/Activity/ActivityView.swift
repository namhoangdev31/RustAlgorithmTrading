import SwiftUI

@available(iOS 26.0 , *)
struct ActivityView: View {
    @Environment(\.presentationMode) var presentationMode
    
    @State private var selectedFilter = "All"
    let filters = ["All", "Unread", "Mentions", "System"]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                // Filters
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        ForEach(filters, id: \.self) { filter in
                            Button(action: {
                                selectedFilter = filter
                            }) {
                                Text(filter)
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 8)
                                    .background(selectedFilter == filter ? Color.blue : Color(.systemGray5))
                                    .foregroundColor(selectedFilter == filter ? .white : .primary)
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
                
                // Alternate System Card Style (Dark) for variety/Earlier
                ZStack {
                    Color.black.opacity(0.9)
                    
                    VStack(alignment: .leading, spacing: 8) {
                        Text("SYSTEM SECURITY")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .foregroundColor(.white.opacity(0.7))
                        
                        Text("Review Login Attempt.")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                        
                        Spacer()
                        
                        Text("We noticed a login from an recognized device in New York, US.")
                            .font(.subheadline)
                            .foregroundColor(.white.opacity(0.8))
                        
                        HStack {
                            Spacer()
                            Button(action: {}) {
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
        .navigationTitle("Activity")
        .navigationSubtitle("Have 4 activity not read")
        .toolbar{
            ToolbarItemGroup(placement: .primaryAction) {
                Button("Up", systemImage: "checkmark.circle.fill", action: {}).tint(.blue)
                Button("Down", systemImage: "bell.badge.fill", action: {}).tint(.blue)
              }
        }
    }
}
