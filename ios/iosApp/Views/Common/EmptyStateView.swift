import ExploreSwiftUI
import SwiftUI

struct EmptyStateView: View {
    let icon: String  // SF Symbol name
    let title: String
    let message: String
    let buttonTitle: String?
    let action: (() -> Void)?

    init(
        icon: String = "magnifyingglass",
        title: String,
        message: String,
        buttonTitle: String? = nil,
        action: (() -> Void)? = nil
    ) {
        self.icon = icon
        self.title = title
        self.message = message
        self.buttonTitle = buttonTitle
        self.action = action
    }

    var body: some View {
        UniContentUnavailableView(title, systemImage: icon, description: message) {
            if let buttonTitle = buttonTitle, let action = action {
                UniButton(action: action) {
                    Text(buttonTitle)
                        .font(.headline)
                        .foregroundColor(.white)
                        .padding()
                        .frame(maxWidth: .infinity)
                        .background(Color.blue)
                        .cornerRadius(12)
                }
                .padding(.top, 16)
                .padding(.horizontal, 48)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
