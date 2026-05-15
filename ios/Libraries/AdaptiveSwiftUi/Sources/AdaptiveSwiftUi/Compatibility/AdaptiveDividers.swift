import SwiftUI

extension View {
    
    /// Sets the color of an adaptive divider.
    ///
    /// This modifier uses an overlay to apply a custom color to the divider component.
    ///
    /// Example:
    /// ```swift
    /// AdaptiveDivider()
    ///     .adaptiveDividerColor(.red)
    /// ```
    @ViewBuilder
    public func adaptiveDividerColor(_ color: Color) -> some View {
        self.overlay(color)
    }

    /// Sets the thickness of an adaptive divider based on its orientation.
    ///
    /// Example:
    /// ```swift
    /// AdaptiveDivider()
    ///     .adaptiveDividerThickness(2, axis: .horizontal)
    /// ```
    @ViewBuilder
    public func adaptiveDividerThickness(_ thickness: CGFloat, axis: Axis = .horizontal) -> some View {
        if axis == .horizontal {
            self.frame(height: thickness)
        } else {
            self.frame(width: thickness)
        }
    }
}
