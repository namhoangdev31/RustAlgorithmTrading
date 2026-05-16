import SwiftUI
import AdaptiveSwiftUi

// import Shared — replaced by native Swift Shared module

struct MiniAppWhatsNewView: View {
    // UI-only: No data model dependency
    
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("What's New")
                    .font(.title2)
                    .fontWeight(.bold)
                Spacer()
                AdaptiveButton(action: {}) {
                    Text("Version History")
                        .font(.system(size: 17))
                }
                .adaptiveButtonStyle(.plain)
            }
            
            HStack {
                Text("Version 2.0.0")
                    .font(.subheadline)
                    .adaptiveForegroundStyle(.secondary)
                Spacer()
                Text("2d ago")
                    .font(.subheadline)
                    .adaptiveForegroundStyle(.secondary)
            }
            
            Text("We've redesigned the dashboard to be even more intuitive. Now featuring local smart meter integration and improved AI classification for eco-purchases.")
                .font(.body)
                .lineSpacing(2)
            
            AdaptiveButton(action: {}) {
                Text("more")
                    .font(.body)
                    .adaptiveForegroundStyle(.blue)
            }
            .adaptiveButtonStyle(.plain)
            .padding(.top, -5)
        }
        .padding()
        .background(Color(UIColor.secondarySystemBackground).opacity(0.3)) // Subtle background if desired, or plain
    }
}
