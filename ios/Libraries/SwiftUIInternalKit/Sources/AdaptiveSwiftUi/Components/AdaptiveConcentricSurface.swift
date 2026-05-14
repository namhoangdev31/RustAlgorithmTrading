import SwiftUI

public struct AdaptiveConcentricSurface<Content: View, Fill: ShapeStyle>: View {
    private let cornerRadius: CGFloat
    private let isUniform: Bool
    private let fill: Fill
    private let content: () -> Content

    public init(
        cornerRadius: CGFloat = 20,
        isUniform: Bool = true,
        fill: Fill,
        @ViewBuilder content: @escaping () -> Content
    ) {
        self.cornerRadius = cornerRadius
        self.isUniform = isUniform
        self.fill = fill
        self.content = content
    }

    @ViewBuilder
    public var body: some View {
        content()
            .background {
                if #available(iOS 26.0, macOS 26.0, tvOS 26.0, watchOS 26.0, visionOS 26.0, *) {
                    ConcentricRectangle(corners: .concentric, isUniform: isUniform)
                        .fill(fill)
                } else {
                    RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                        .fill(fill)
                }
            }
    }
}

public extension View {
    func adaptiveConcentricSurface<Fill: ShapeStyle>(
        cornerRadius: CGFloat = 20,
        isUniform: Bool = true,
        fill: Fill
    ) -> some View {
        AdaptiveConcentricSurface(cornerRadius: cornerRadius, isUniform: isUniform, fill: fill) {
            self
        }
    }
}
