import ExploreSwiftUI
import SwiftUI

struct ReviewGuidelinesView: View {
    var body: some View {
        UniScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text("Review Guidelines")
                    .font(.largeTitle)
                    .fontWeight(.bold)

                Text(
                    "Help keep our community helpful and safe by following these guidelines when writing reviews."
                )
                .font(.body)
                .uniForegroundStyle(.secondary)

                VStack(alignment: .leading, spacing: 16) {
                    GuidelineItem(
                        icon: "checkmark.circle.fill", color: .green, title: "Be Helpful",
                        description:
                            "Focus on the app's features, functionality, and your personal experience."
                    )
                    GuidelineItem(
                        icon: "checkmark.circle.fill", color: .green, title: "Be Specific",
                        description:
                            "Explain what you liked or didn't like. Details help developers improve their app."
                    )
                    GuidelineItem(
                        icon: "xmark.circle.fill", color: .red, title: "No Spam",
                        description:
                            "Avoid posting advertisements, promotional material, or repetitive content."
                    )
                    GuidelineItem(
                        icon: "xmark.circle.fill", color: .red, title: "No Hate Speech",
                        description:
                            "We have zero tolerance for hate speech, harassment, or offensive language."
                    )
                }
                .padding(.top, 16)

                Text("Reviews that violate these guidelines may be removed.")
                    .font(.caption)
                    .uniForegroundStyle(.secondary)
                    .padding(.top, 24)
            }
            .padding()
        }
        .navigationTitle("Guidelines")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct GuidelineItem: View {
    let icon: String
    let color: Color
    let title: String
    let description: String

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon)
                .font(.title3)
                .uniForegroundStyle(color)
                .padding(.top, 2)

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                Text(description)
                    .font(.body)
                    .uniForegroundStyle(.secondary)
            }
        }
    }
}

#Preview {
    NavigationView {
        ReviewGuidelinesView()
    }
}
