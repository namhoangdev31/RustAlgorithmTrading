//
// Created by Hoàng Nam on 27/1/26.
//

import SwiftUI

@available(iOS 26.0 , *)
struct LiquidGlassButtonModifier: ViewModifier {
    let cornerRadius: CGFloat

    func body(content: Content) -> some View {
        content
            .background(.clear)
            .buttonStyle(.glass)
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
    func liquidGlassButton(cornerRadius: CGFloat = 28) -> some View {
        modifier(LiquidGlassButtonModifier(cornerRadius: cornerRadius))
    }
}