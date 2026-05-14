import SwiftUI

struct LiquidGlassModifier: ViewModifier {
    let cornerRadius: CGFloat

    func body(content: Content) -> some View {
        content
            .adaptiveGlass(cornerRadius: cornerRadius)
    }
}

extension View {
    func liquidGlass(cornerRadius: CGFloat = 28) -> some View {
        modifier(LiquidGlassModifier(cornerRadius: cornerRadius))
    }
}
