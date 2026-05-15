import SwiftUI

/// A shape that replaces itself with a version of the container's relative shape.
///
/// `AdaptiveContainerRelativeShape` provides a bridge for the modern container-relative 
/// geometry features:
/// - **Modern OS (iOS 14+, macOS 11+)**: Leverages the native `ContainerRelativeShape` 
///   which automatically computes its corner radius to match the nearest container's radius.
/// - **Legacy Fallback (iOS 13)**: Falls back to a standard `Rectangle` to maintain 
///   the structural layout on older systems.
///
/// Example:
/// ```swift
/// AdaptiveContainerRelativeShape()
///     .fill(Color.blue)
///     .padding(4)
/// ```
public struct AdaptiveContainerRelativeShape: InsettableShape {
    var insetAmount: CGFloat = 0

    /// Creates an adaptive container relative shape.
    public init() {}

    public func path(in rect: CGRect) -> Path {
        if #available(iOS 14.0, macOS 11.0, tvOS 14.0, watchOS 7.0, visionOS 1.0, *) {
            return ContainerRelativeShape().inset(by: insetAmount).path(in: rect)
        } else {
            return Rectangle().inset(by: insetAmount).path(in: rect)
        }
    }

    /// Returns a new shape that is inset by the given amount.
    public func inset(by amount: CGFloat) -> AdaptiveContainerRelativeShape {
        var shape = self
        shape.insetAmount += amount
        return shape
    }
}
