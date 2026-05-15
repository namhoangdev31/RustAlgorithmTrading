import SwiftUI

/// A highly adaptive button component that works across all Apple platforms and OS versions.
///
/// `AdaptiveButton` abstracts away the complexities of different `Button` APIs, automatically 
/// handling button roles, styles, and sizing. It supports modern iOS 26+ roles while providing 
/// intelligent fallbacks for older systems.
///
/// Example:
/// ```swift
/// AdaptiveButton("Delete Item", role: .destructive) {
///     deleteData()
/// }
/// .adaptiveButtonStyle(.borderedProminent)
/// ```
public struct AdaptiveButton<Label: View>: View {
    private let role: AdaptiveButtonRole?
    private let style: AdaptiveButtonStyle
    private let sizing: AdaptiveButtonSizing
    private let tint: Color?
    private let borderShape: AdaptiveButtonBorderShape
    private let action: () -> Void
    private let label: () -> Label

    /// Creates an adaptive button with a custom label.
    ///
    /// - Parameters:
    ///   - role: The button's role (e.g., `.cancel`, `.destructive`).
    ///   - style: The visual style (e.g., `.bordered`, `.plain`).
    ///   - sizing: The button's sizing behavior.
    ///   - tint: An optional tint color.
    ///   - borderShape: The shape of the button's border.
    ///   - action: The action to perform when the button is tapped.
    ///   - label: A view builder that describes the button's content.
    public init(
        role: AdaptiveButtonRole? = nil,
        style: AdaptiveButtonStyle = .automatic,
        sizing: AdaptiveButtonSizing = .automatic,
        tint: Color? = nil,
        borderShape: AdaptiveButtonBorderShape = .automatic,
        action: @escaping () -> Void,
        @ViewBuilder label: @escaping () -> Label
    ) {
        self.role = role
        self.style = style
        self.sizing = sizing
        self.tint = tint
        self.borderShape = borderShape
        self.action = action
        self.label = label
    }

    /// Creates an adaptive button with a title key.
    ///
    /// Example:
    /// ```swift
    /// AdaptiveButton("Submit", action: submitForm)
    /// ```
    public init(
        _ titleKey: LocalizedStringKey,
        role: AdaptiveButtonRole? = nil,
        style: AdaptiveButtonStyle = .automatic,
        sizing: AdaptiveButtonSizing = .automatic,
        tint: Color? = nil,
        borderShape: AdaptiveButtonBorderShape = .automatic,
        action: @escaping () -> Void
    ) where Label == Text {
        self.init(
            role: role,
            style: style,
            sizing: sizing,
            tint: tint,
            borderShape: borderShape,
            action: action
        ) {
            Text(titleKey)
        }
    }

    /// Creates an adaptive button with a title and a system image.
    ///
    /// Example:
    /// ```swift
    /// AdaptiveButton("Settings", systemImage: "gear", action: showSettings)
    /// ```
    public init(
        _ titleKey: LocalizedStringKey,
        systemImage: String,
        role: AdaptiveButtonRole? = nil,
        style: AdaptiveButtonStyle = .automatic,
        sizing: AdaptiveButtonSizing = .automatic,
        tint: Color? = nil,
        borderShape: AdaptiveButtonBorderShape = .automatic,
        action: @escaping () -> Void
    ) where Label == SwiftUI.Label<Text, Image> {
        self.init(
            role: role,
            style: style,
            sizing: sizing,
            tint: tint,
            borderShape: borderShape,
            action: action
        ) {
            SwiftUI.Label(titleKey, systemImage: systemImage)
        }
    }

    public var body: some View {
        Group {
            if let role {
                if #available(iOS 26.0, macOS 26.0, tvOS 26.0, watchOS 26.0, visionOS 26.0, *) {
                    Button(role: modernRole(role), action: action) {
                        label()
                    }
                } else {
                    Button(role: role.fallbackButtonRole, action: action) {
                        label()
                    }
                }
            } else {
                Button(action: action) {
                    label()
                }
            }
        }
        .adaptiveButtonStyle(style)
        .adaptiveButtonSizing(sizing)
        .adaptiveButtonTint(tint)
        .adaptiveButtonBorderShape(borderShape)
    }

    @available(iOS 26.0, macOS 26.0, tvOS 26.0, watchOS 26.0, visionOS 26.0, *)
    private func modernRole(_ role: AdaptiveButtonRole) -> ButtonRole {
        switch role {
        case .cancel:
            return .cancel
        case .close:
            return .close
        case .confirm:
            return .confirm
        case .destructive:
            return .destructive
        }
    }
}

// Extension to bridge AdaptiveButtonRole to native roles
private extension AdaptiveButtonRole {
    var fallbackButtonRole: ButtonRole? {
        switch self {
        case .cancel:
            return .cancel
        case .destructive:
            return .destructive
        case .close, .confirm:
            return nil
        }
    }
}
