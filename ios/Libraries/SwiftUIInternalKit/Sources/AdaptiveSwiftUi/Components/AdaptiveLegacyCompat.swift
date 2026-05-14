import SwiftUI

public struct AdaptiveLegacyCardModifier: ViewModifier {
    private let cornerRadius: CGFloat

    public init(cornerRadius: CGFloat = 20) {
        self.cornerRadius = cornerRadius
    }

    public func body(content: Content) -> some View {
        content
            .adaptiveGlass(cornerRadius: cornerRadius)
    }
}

public extension View {
    func adaptiveLegacyCard(cornerRadius: CGFloat = 20) -> some View {
        modifier(AdaptiveLegacyCardModifier(cornerRadius: cornerRadius))
    }
}
