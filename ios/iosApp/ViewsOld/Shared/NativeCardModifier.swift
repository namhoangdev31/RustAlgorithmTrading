import SwiftUI

// MARK: - Native iOS Card Style (App Store inspired)
// Replaces glassEffect / liquidGlass with standard iOS native material effects.

extension View {
    /// Standard App Store–style card background.
    func nativeCard(cornerRadius: CGFloat = 12) -> some View {
        self
            .background(Color(.secondarySystemGroupedBackground))
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
            .shadow(color: .black.opacity(0.06), radius: 8, x: 0, y: 2)
    }

    /// Frosted-glass look using .ultraThinMaterial (iOS 15+).
    /// Used in floating overlays, sticky footers – replaces glassEffect().
    func frostedCard(cornerRadius: CGFloat = 16) -> some View {
        self
            .background(.ultraThinMaterial)
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
            .shadow(color: .black.opacity(0.08), radius: 12, x: 0, y: 4)
    }

    /// Circle button style (replaces liquidGlass on round icon buttons).
    func circleButton(size: CGFloat = 50) -> some View {
        self
            .frame(width: size, height: size)
            .background(.ultraThinMaterial)
            .clipShape(Circle())
            .shadow(color: .black.opacity(0.1), radius: 6, x: 0, y: 2)
    }

    /// Standard input field background (replaces glassEffect on TextFields).
    func nativeInputField() -> some View {
        self
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
            .background(Color(.systemGray6))
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    }
}
