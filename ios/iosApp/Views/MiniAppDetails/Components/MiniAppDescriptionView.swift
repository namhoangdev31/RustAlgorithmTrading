import SwiftUI
// import Shared — replaced by native Swift Shared module

struct MiniAppDescriptionView: View {
    // UI-only: No data model dependency
    
    var body: some View {
        VStack(alignment: .leading, spacing: 15) {
            Text("EcoTrack Pro is your all-in-one companion for a greener lifestyle. Automatically track your carbon footprint from daily purchases.")
                .font(.body)
                .fontWeight(.medium)
            
            Text("Join over 500,000 eco-warriors and start making a real difference today. Our advanced AI-driven categorization seamlessly integrates with your digital receipts and smart home devices to give you a real-time view of your environmental impact.")
                .font(.body)
                .foregroundColor(.secondary)
            
            HStack {
                Text("GreenLogic Labs")
                    .foregroundColor(.blue)
                    .font(.subheadline)
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.gray)
            }
            .padding(.top, 10)
        }
        .padding()
    }
}
