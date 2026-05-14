//
// Created by Hoàng Nam on 27/1/26.
//

import SwiftUI

struct LiquidGlassButtonModifier: ViewModifier {
    let cornerRadius: CGFloat

    func body(content: Content) -> some View {
        content
            .adaptiveGlassButton(cornerRadius: cornerRadius)
    }
}

extension View {
    func liquidGlassButton(cornerRadius: CGFloat = 28) -> some View {
        modifier(LiquidGlassButtonModifier(cornerRadius: cornerRadius))
    }
}
