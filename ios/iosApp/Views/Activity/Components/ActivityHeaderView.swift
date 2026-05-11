import SwiftUI

struct ActivityHeaderView: View {
    var body: some View {
        HStack(alignment: .bottom) {
            VStack(alignment: .leading, spacing: 4) {
                Text("THURSDAY, OCT 24")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.gray)
                
                Text("Activity")
                    .font(.largeTitle)
                    .fontWeight(.bold)
            }
            
            Spacer()
            
            // Read All Button
            Button(action: {
                // Action to mark all as read
            }) {
                Image(systemName: "checkmark.circle.fill") // Replaced "checkmark.circle.badge.questionmark.fill" with a simpler SF Symbol if needed, or use custom behavior
                    .font(.system(size: 28))
                    .foregroundColor(Color(.systemGray5))
                    .overlay(
                        Image(systemName: "checkmark")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.blue)
                    )
            }
            
            // Profile Icon (optional, if needed to match Home, but requirements didn't explicitly ask for it here, keeping it clean based on "Read All" request)
             Image(systemName: "person.crop.circle.fill") // Placeholder
                 .resizable()
                 .frame(width: 30, height: 30)
                 .foregroundColor(.orange.opacity(0.8))
                 .background(Color(.systemGray6))
                 .clipShape(Circle())
        }
        .padding(.horizontal)
        .padding(.bottom, 8)
    }
}
