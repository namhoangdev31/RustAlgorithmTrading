import SwiftUI

/// An adaptive representation of the modern `ConcentricRectangle` shape.
///
/// `AdaptiveConcentricRectangle` provides a bridge for the advanced geometry features 
/// introduced in future OS versions (iOS 26+).
/// - **Modern OS (iOS 26+)**: Leverages the native `ConcentricRectangle` which dynamically 
///   computes corner radii based on its nesting context.
/// - **Legacy Fallback**: Uses a `RoundedRectangle` with a continuous corner style and 
///   automatically adjusts the radius based on the current inset to simulate concentricity.
///
/// Example:
/// ```swift
/// AdaptiveConcentricRectangle(fallbackCornerRadius: 30)
///     .stroke(Color.blue, lineWidth: 2)
///     .frame(width: 200, height: 100)
/// ```
public struct AdaptiveConcentricRectangle: InsettableShape {
    public var fallbackCornerRadius: CGFloat
    public var isUniform: Bool
    public var insetAmount: CGFloat = 0

    /// Creates an adaptive concentric rectangle.
    ///
    /// - Parameters:
    ///   - fallbackCornerRadius: The corner radius to use on platforms that don't support native concentric rectangles.
    ///   - isUniform: Whether the corners should be uniform on OS versions that support native concentric rectangles.
    public init(fallbackCornerRadius: CGFloat = 20, isUniform: Bool = true) {
        self.fallbackCornerRadius = fallbackCornerRadius
        self.isUniform = isUniform
    }

    public func path(in rect: CGRect) -> Path {
        let insetRect = rect.insetBy(dx: insetAmount, dy: insetAmount)

        if #available(iOS 26.0, macOS 26.0, tvOS 26.0, watchOS 26.0, visionOS 26.0, *) {
            /// Native ConcentricRectangle dynamically computes its radius from the container context.
            return ConcentricRectangle(corners: .concentric, isUniform: isUniform)
                .path(in: insetRect)
        } else {
            return RoundedRectangle(
                cornerRadius: max(0, fallbackCornerRadius - insetAmount), style: .continuous
            )
            .path(in: insetRect)
        }
    }

    /// Returns a new shape that is inset by the given amount.
    public func inset(by amount: CGFloat) -> AdaptiveConcentricRectangle {
        var shape = self
        shape.insetAmount += amount
        return shape
    }
}
