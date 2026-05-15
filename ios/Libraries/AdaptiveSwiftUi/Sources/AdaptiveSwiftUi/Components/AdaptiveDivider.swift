import SwiftUI

public struct AdaptiveDivider: View {
    private let axis: Axis
    private let color: Color?
    private let thickness: CGFloat?

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

// Internal helper for conditional modifiers if not already present in the library
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
