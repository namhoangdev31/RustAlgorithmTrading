import SwiftUI

/// A view modifier that applies a standardized card appearance to a view.
///
/// `AdaptiveLegacyCardModifier` encapsulates the recommended styling for container 
/// elements, ensuring they look like modern cards across all supported OS versions. 
/// It internally uses `adaptiveGlass` to apply a subtle glass effect and rounded corners.
///
/// Example:
/// ```swift
/// Text("Card Content")
///     .modifier(AdaptiveLegacyCardModifier(cornerRadius: 12))
/// ```
public struct AdaptiveLegacyCardModifier: ViewModifier {
    private let cornerRadius: CGFloat

    /// Creates a card modifier with a specific corner radius.
    ///
    /// - Parameter cornerRadius: The radius of the card's corners. Defaults to 20.
    public init(cornerRadius: CGFloat = 20) {
        self.cornerRadius = cornerRadius
    }

    public func body(content: Content) -> some View {
        content
            .adaptiveGlass(cornerRadius: cornerRadius)
    }
}

public extension View {
    /// Wraps the view in a standardized adaptive card style.
    ///
    /// This is a convenience method for applying the `AdaptiveLegacyCardModifier`.
    ///
    /// Example:
    /// ```swift
    /// VStack {
    ///     Text("Hello World")
    /// }
    /// .adaptiveLegacyCard(cornerRadius: 15)
    /// ```
    ///
    /// - Parameter cornerRadius: The radius of the card's corners.
    func adaptiveLegacyCard(cornerRadius: CGFloat = 20) -> some View {
        modifier(AdaptiveLegacyCardModifier(cornerRadius: cornerRadius))
    }
}
