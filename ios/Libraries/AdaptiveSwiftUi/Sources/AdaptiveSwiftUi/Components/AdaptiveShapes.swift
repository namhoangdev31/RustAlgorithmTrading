import SwiftUI

/// An adaptive representation of `ContainerRelativeShape`.
/// - Uses the native `ContainerRelativeShape` on iOS 14.0+, macOS 11.0+, watchOS 7.0+, tvOS 14.0+, visionOS 1.0+.
/// - Falls back to a standard `Rectangle` on older versions (e.g. iOS 13).
public struct AdaptiveContainerRelativeShape: InsettableShape {
    var insetAmount: CGFloat = 0

    public init() {}

    public func path(in rect: CGRect) -> Path {
        if #available(iOS 14.0, macOS 11.0, tvOS 14.0, watchOS 7.0, visionOS 1.0, *) {
            return ContainerRelativeShape().inset(by: insetAmount).path(in: rect)
        } else {
            return Rectangle().inset(by: insetAmount).path(in: rect)
        }
    }

    public func inset(by amount: CGFloat) -> AdaptiveContainerRelativeShape {
        var shape = self
        shape.insetAmount += amount
        return shape
    }
}
