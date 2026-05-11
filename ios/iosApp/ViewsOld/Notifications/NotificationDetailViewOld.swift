import SwiftUI

struct NotificationDetailViewOld: View {
    let notification: NotificationItemOld
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text(notification.time)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                Text(notification.title)
                    .font(.title)
                    .fontWeight(.bold)
                
                Text(notification.message)
                    .font(.body)
                    .lineSpacing(6)
                
                if notification.type == "update" {
                    Button(action: {
                        // Update action
                    }) {
                        Text("Update Now")
                            .font(.headline)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.blue)
                            .cornerRadius(12)
                    }
                    .padding(.top, 24)
                }
            }
            .padding()
        }
        .navigationTitle("Detail")
        .navigationBarTitleDisplayMode(.inline)
    }
}
