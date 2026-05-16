import SwiftUI
import AdaptiveSwiftUi


struct EditorChoiceView: View {
    var body: some View {

        ZStack(alignment: .bottomLeading) {
            // Background Image/Gradient
            LinearGradient(colors: [Color.blue.opacity(0.8), Color.black.opacity(0.8)], startPoint: .topLeading, endPoint: .bottomTrailing)
                .adaptiveGlass(cornerRadius: 20)

            VStack(alignment: .leading, spacing: 8) {
                Text("EDITOR'S CHOICE")
                    .font(.footnote)
                    .fontWeight(.semibold)
                    .adaptiveForegroundStyle(.white)
                Text("Master Your\nWorkflow")
                    .font(.title)
                    .fontWeight(.bold)
                    .adaptiveForegroundStyle(.white)

                Spacer()

                Text("The ultimate toolkit for high-performance teams, now in your pocket.")
                    .font(.subheadline)
                    .adaptiveForegroundStyle(.white, opacity: 0.9)
                    .lineLimit(3)
            }
            .padding(24)
        }
        .frame(height: 350)
        .padding(.horizontal)
        .shadow(color: Color.black.opacity(0.2), radius: 10, x: 0, y: 5)

    }
}
