import SwiftUI

struct EditorChoiceView: View {
    var body: some View {

        ZStack(alignment: .bottomLeading) {
            // Background Image/Gradient
            LinearGradient(colors: [Color.blue.opacity(0.8), Color.black.opacity(0.8)], startPoint: .topLeading, endPoint: .bottomTrailing)
                .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))

            VStack(alignment: .leading, spacing: 8) {
                Text("EDITOR'S CHOICE")
                    .font(.footnote)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                Text("Master Your\nWorkflow")
                    .font(.title)
                    .fontWeight(.bold)
                    .foregroundColor(.white)

                Spacer()

                Text("The ultimate toolkit for high-performance teams, now in your pocket.")
                    .font(.subheadline)
                    .foregroundColor(.white.opacity(0.9))
                    .lineLimit(3)
            }
            .padding(24)
        }
        .frame(height: 350)
        .padding(.horizontal)
        .shadow(color: Color.black.opacity(0.2), radius: 10, x: 0, y: 5)

    }
}
