import SwiftUI
import AdaptiveSwiftUi


struct EditorChoiceHeaderView: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Spacer()
            
            Text("ĐƯỢC YÊU THÍCH") // "LOVED"
                .font(.caption)
                .fontWeight(.bold)
                .adaptiveTracking(1.0)
                .adaptiveForegroundStyle(.white)
            
            Text("Step Into the\nArena:\nCrossfire\nLegends")
                .font(.system(size: 40, weight: .black, design: .rounded))
                .lineLimit(4)
                .adaptiveForegroundStyle(.white)
            
            Text("Crossfire Legends")
                .font(.title3)
                .fontWeight(.semibold)
                .adaptiveForegroundStyle(.white)
                .padding(.top, 4)
        }
        .padding(.horizontal, 24)
        .padding(.bottom, 40)
        .frame(height: 500)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            ZStack {
                Image("editor_choice_bg_placeholder")
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(height: 500)
                    .clipped()
                
                LinearGradient(
                    gradient: Gradient(colors: [Color.clear, Color.black.opacity(0.8), Color.black]),
                    startPoint: .center,
                    endPoint: .bottom
                )
                
                LinearGradient(
                    gradient: Gradient(colors: [Color.black.opacity(0.6), Color.clear]),
                    startPoint: .top,
                    endPoint: .center
                )
            }
        )
        .clipped() // Ensure background doesn't bleed
    }
}
