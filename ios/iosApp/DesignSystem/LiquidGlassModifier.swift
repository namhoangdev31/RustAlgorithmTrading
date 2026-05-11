import SwiftUI
import Foundation

@available(iOS 26.0 , *)
struct LiquidGlassModifier: ViewModifier {
    let cornerRadius: CGFloat

    func body(content: Content) -> some View {
        content
            .background(.clear)
            .glassEffect()
            .clipShape(
                RoundedRectangle(
                    cornerRadius: cornerRadius,
                    style: .continuous
                )
            )
    }
}

@available(iOS 26.0 , *)
extension View {
    func liquidGlass(cornerRadius: CGFloat = 28) -> some View {
        modifier(LiquidGlassModifier(cornerRadius: cornerRadius))
    }
}