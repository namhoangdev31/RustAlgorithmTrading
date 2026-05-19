import ExploreSwiftUI
import SwiftUI

struct InfoColumn: View {
    let topText: String
    let bottomText: String
    let iconName: String?
    let subtitleText: String?

    // Initializer for Rating Style (Big Num + Stars)
    init(rating: String, maxRating: Int = 5) {
        self.topText = rating
        self.bottomText = ""  // Handled custom
        self.iconName = nil
        self.subtitleText = "RATINGS"  // Just a marker, logic below handles rendering
    }

    // Initializer for Age/Text Style
    init(topText: String, bottomText: String, subtitle: String? = nil) {
        self.topText = topText
        self.bottomText = bottomText
        self.iconName = nil
        self.subtitleText = subtitle
    }

    // Initializer for Icon Style
    init(iconName: String, bottomText: String) {
        self.topText = ""
        self.bottomText = bottomText
        self.iconName = iconName
        self.subtitleText = nil
    }

    var body: some View {
        VStack(spacing: 4) {
            if let icon = iconName {
                Image(systemName: icon)
                    .font(.system(size: 22, weight: .bold))
                    .uniForegroundStyle(.secondary)
            } else {
                Text(topText)
                    .font(.system(size: 22, weight: .bold))
                    .uniForegroundStyle(.secondary)
            }

            if bottomText.isEmpty, subtitleText == "RATINGS" {
                // Star rating mock
                HStack(spacing: 0) {
                    ForEach(0..<4) { _ in
                        Image(systemName: "star.fill")
                            .font(.system(size: 10))
                            .foregroundColor(.gray)
                    }
                    Image(systemName: "star.leadinghalf.filled")
                        .font(.system(size: 10))
                        .foregroundColor(.gray)
                }

                Text("2.4K Ratings")
                    .font(.system(size: 11))
                    .foregroundColor(.gray)
                    .padding(.top, 2)
            } else {
                Text(bottomText)
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(.gray.opacity(0.8))
            }

            if let sub = subtitleText, sub != "RATINGS" {
                Text(sub)
                    .font(.system(size: 11))
                    .foregroundColor(.gray)
            }
        }
        .frame(minWidth: 80)
    }
}

struct MiniAppRatingsView: View {
    var body: some View {
        UniScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 0) {
                // Ratings
                VStack(spacing: 4) {
                    HStack(spacing: 2) {
                        Text("4.8")
                            .font(.system(size: 22, weight: .bold))  // Darker gray in light mode
                            .uniForegroundStyle(.primary, opacity: 0.6)
                    }
                    HStack(spacing: 0) {  // Stars
                        ForEach(0..<4) { _ in
                            Image(systemName: "star.fill")
                                .font(.system(size: 10))
                                .uniForegroundStyle(.secondary)
                        }
                        Image(systemName: "star.leadinghalf.filled")  // 4.5
                            .font(.system(size: 10))
                            .uniForegroundStyle(.secondary)
                    }
                    Text("2.4K Ratings")
                        .font(.system(size: 11))
                        .uniForegroundStyle(.secondary)
                }
                .frame(minWidth: 100)

                UniDivider().frame(height: 30)

                // Age
                VStack(spacing: 4) {
                    Text("4+")
                        .font(.system(size: 22, weight: .bold))
                        .foregroundColor(.primary.opacity(0.6))
                    Text("AGE")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(.gray)
                    Text("Years Old")
                        .font(.system(size: 11))
                        .foregroundColor(.gray)
                }
                .frame(minWidth: 100)

                Divider().frame(height: 30)

                // Category
                VStack(spacing: 4) {
                    Image(systemName: "folder.fill")  // Placeholder icon
                        .font(.system(size: 24))
                        .foregroundColor(.primary.opacity(0.6))
                        .padding(.bottom, 2)
                    Text("Productivity")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(.gray)
                }
                .frame(minWidth: 100)

                Divider().frame(height: 30)

                // Language
                VStack(spacing: 4) {
                    Text("EN")
                        .font(.system(size: 22, weight: .bold))
                        .uniForegroundStyle(.primary, opacity: 0.6)
                    Text("Language")
                        .font(.system(size: 11, weight: .bold))
                        .uniForegroundStyle(.secondary)
                    Text("+ 12 More")
                        .font(.system(size: 11))
                        .uniForegroundStyle(.secondary)
                }
                .frame(minWidth: 100)
            }
            .padding(.horizontal)
            .padding(.vertical, 10)
        }
    }
}
