import SwiftUI
import AdaptiveSwiftUi


struct SearchSuggestionsView: View {
    let query: String
    
    var suggestions: [String] {
        if query.lowercased().hasPrefix("foo") {
            return [
                "Food delivery",
                "Food recipes",
                "Football scores",
                "Footwear fashion",
                "Food near me"
            ]
        } else if query.lowercased().hasPrefix("eco") {
            return [
                "Eco-friendly travel",
                "Eco products",
                "Economy news"
            ]
        } else if !query.isEmpty {
            return [
                "\(query) apps",
                "\(query) services",
                "\(query) near me"
            ]
        }
        return []
    }
    
    var body: some View {
        VStack(spacing: 0) {
            ForEach(suggestions, id: \.self) { suggestion in
                HStack(spacing: 16) {
                    Image(systemName: "magnifyingglass")
                        .font(.body)
                        .adaptiveForegroundStyle(.secondary)
                    
                    Text(suggestion)
                        .font(.body)
                    
                    Spacer()
                    
                    Image(systemName: "arrow.up.left")
                        .font(.caption)
                        .adaptiveForegroundStyle(.secondary, opacity: 0.5)
                }
                .padding()
                .background(Color(.systemBackground))
                
                AdaptiveDivider()
            }
        }
    }
}
