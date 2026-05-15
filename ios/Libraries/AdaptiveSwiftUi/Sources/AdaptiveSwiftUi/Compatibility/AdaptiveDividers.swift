import SwiftUI

extension View {
    @ViewBuilder
    public func adaptiveDividerColor(_ color: Color) -> some View {
        self.overlay(color)
    }

    @ViewBuilder
    public func adaptiveDividerThickness(_ thickness: CGFloat, axis: Axis = .horizontal) -> some View {
        if axis == .horizontal {
            self.frame(height: thickness)
        } else {
            self.frame(width: thickness)
        }
    }
}
