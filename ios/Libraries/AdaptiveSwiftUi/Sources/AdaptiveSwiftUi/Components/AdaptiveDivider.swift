import SwiftUI

/// A customizable divider that works adaptively across platforms.
///
/// `AdaptiveDivider` extends the standard `Divider` by providing easy-to-use 
/// parameters for axis, color, and thickness, while ensuring visual consistency 
/// across different OS versions.
///
/// Example:
/// ```swift
/// AdaptiveDivider(.horizontal, color: .gray, thickness: 1)
/// ```
public struct AdaptiveDivider: View {
    private let axis: Axis
    private let color: Color?
    private let thickness: CGFloat?

    /// Creates an adaptive divider.
    ///
    /// - Parameters:
    ///   - axis: The alignment axis of the divider (horizontal or vertical).
    ///   - color: An optional color for the divider line.
    ///   - thickness: An optional thickness for the divider line.
    public init(
        _ axis: Axis = .horizontal,
        color: Color? = nil,
        thickness: CGFloat? = nil
    ) {
        self.axis = axis
        self.color = color
        self.thickness = thickness
    }

    public var body: some View {
        Divider()
            .applyIf(thickness != nil) {
                $0.adaptiveDividerThickness(thickness!, axis: axis)
            }
            .applyIf(color != nil) {
                $0.adaptiveDividerColor(color!)
            }
    }
}

// Internal helper for conditional modifiers
extension View {
    @ViewBuilder
    func applyIf<Content: View>(_ condition: Bool, transform: (Self) -> Content) -> some View {
        if condition {
            transform(self)
        } else {
            self
        }
    }
}
