import SwiftUI

/// An adaptive representation of the OS 26+ `ConcentricRectangle`.
/// - Uses the native `ConcentricRectangle` on supported platforms (iOS 26.0+).
/// - Falls back to a standard `RoundedRectangle` using the provided fallback corner radius on older versions.
public struct AdaptiveConcentricRectangle: InsettableShape {
    public var fallbackCornerRadius: CGFloat
    public var isUniform: Bool
    public var insetAmount: CGFloat = 0

    /// Creates an adaptive concentric rectangle.
    /// - Parameters:
    ///   - fallbackCornerRadius: The corner radius to use on OS versions < 26.0.
    ///   - isUniform: Whether the corners should be uniform on OS versions >= 26.0.
    public init(fallbackCornerRadius: CGFloat = 20, isUniform: Bool = true) {
        self.fallbackCornerRadius = fallbackCornerRadius
        self.isUniform = isUniform
    }

    public func path(in rect: CGRect) -> Path {
        if #available(iOS 26.0, macOS 26.0, tvOS 26.0, watchOS 26.0, visionOS 26.0, *) {
            // Native ConcentricRectangle dynamically computes its radius from the container context.
            return ConcentricRectangle(corners: .concentric, isUniform: isUniform)
                .inset(by: insetAmount)
                .path(in: rect)
        } else {
            return RoundedRectangle(cornerRadius: max(0, fallbackCornerRadius - insetAmount), style: .continuous)
                .path(in: rect)
        }
    }

    public func inset(by amount: CGFloat) -> AdaptiveConcentricRectangle {
        var shape = self
        shape.insetAmount += amount
        return shape
    }
}
