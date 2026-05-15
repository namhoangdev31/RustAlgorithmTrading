import SwiftUI


/// A button component that uses semantic roles to determine its appearance and behavior.
///
/// `AdaptiveRoleButton` simplifies the creation of standard system buttons:
/// - **Modern OS (iOS 26+)**: Leverages native button roles including confirmed and close.
/// - **Legacy Fallback**: Automatically maps to standard roles (`cancel`, `destructive`) 
///   and provides localized fallback titles for older systems.
///
/// Example:
/// ```swift
/// AdaptiveRoleButton(role: .destructive) {
///     deleteData()
/// }
/// ```
public struct AdaptiveRoleButton: View {
    private let role: AdaptiveButtonRole
    private let title: LocalizedStringKey?
    private let style: AdaptiveButtonStyle
    private let sizing: AdaptiveButtonSizing
    private let tint: Color?
    private let borderShape: AdaptiveButtonBorderShape
    private let action: () -> Void

    /// Creates an adaptive role-based button.
    ///
    /// - Parameters:
    ///   - role: The semantic role of the button (e.g., `.cancel`, `.destructive`).
    ///   - title: An optional localized title. If nil, a standard system title is used.
    ///   - style: The visual style of the button.
    ///   - sizing: The sizing behavior.
    ///   - tint: An optional tint color.
    ///   - borderShape: The shape of the button's border.
    ///   - action: The action to perform when tapped.
    public init(
        role: AdaptiveButtonRole,
        title: LocalizedStringKey? = nil,
        style: AdaptiveButtonStyle = .automatic,
        sizing: AdaptiveButtonSizing = .automatic,
        tint: Color? = nil,
        borderShape: AdaptiveButtonBorderShape = .automatic,
        action: @escaping () -> Void
    ) {
        self.role = role
        self.title = title
        self.style = style
        self.sizing = sizing
        self.tint = tint
        self.borderShape = borderShape
        self.action = action
    }

    @ViewBuilder
    public var body: some View {
        Group {
            if #available(iOS 26.0, macOS 26.0, tvOS 26.0, watchOS 26.0, visionOS 26.0, *) {
                if let title {
                    Button(title, role: modernRole, action: action)
                } else {
                    Button(role: modernRole, action: action)
                }
            } else {
                Button(title ?? role.fallbackTitle, role: role.fallbackButtonRole, action: action)
            }
        }
        .adaptiveButtonStyle(style)
        .adaptiveButtonSizing(sizing)
        .adaptiveButtonTint(tint)
        .adaptiveButtonBorderShape(borderShape)
    }

    @available(iOS 26.0, macOS 26.0, tvOS 26.0, watchOS 26.0, visionOS 26.0, *)
    private var modernRole: ButtonRole {
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

/// A button that triggers a rename action, adapting to the native `RenameButton` on newer OS versions.
///
/// Example:
/// ```swift
/// AdaptiveRenameButton {
///     startRenaming()
/// }
/// ```
public struct AdaptiveRenameButton: View {
    private let title: LocalizedStringKey
    private let sizing: AdaptiveButtonSizing
    private let tint: Color?
    private let action: () -> Void

    public init(
        title: LocalizedStringKey = "Rename",
        sizing: AdaptiveButtonSizing = .automatic,
        tint: Color? = nil,
        action: @escaping () -> Void
    ) {
        self.title = title
        self.sizing = sizing
        self.tint = tint
        self.action = action
    }

    @ViewBuilder
    public var body: some View {
        Group {
            if #available(iOS 16.0, macOS 13.0, watchOS 9.0, tvOS 16.0, visionOS 1.0, *) {
                RenameButton()
                    .renameAction(action)
            } else {
                Button(title, action: action)
            }
        }
        .adaptiveButtonSizing(sizing)
        .adaptiveButtonTint(tint)
    }
}

/// A button that reads the system clipboard and performs a paste action.
///
/// `AdaptivePasteButton` leverages the modern `PasteButton` API (iOS 16+) 
/// to provide a secure and standard way for users to paste data.
///
/// Example:
/// ```swift
/// AdaptivePasteButton { string in
///     self.text = string
/// }
/// ```
public struct AdaptivePasteButton: View {
    private let title: LocalizedStringKey
    private let sizing: AdaptiveButtonSizing
    private let tint: Color?
    private let onPaste: (String) -> Void

    public init(
        title: LocalizedStringKey = "Paste",
        sizing: AdaptiveButtonSizing = .automatic,
        tint: Color? = nil,
        onPaste: @escaping (String) -> Void
    ) {
        self.title = title
        self.sizing = sizing
        self.tint = tint
        self.onPaste = onPaste
    }

    @ViewBuilder
    public var body: some View {
        Group {
            #if !os(tvOS) && !os(watchOS)
            if #available(iOS 16.0, macOS 13.0, visionOS 1.0, *) {
                PasteButton(payloadType: String.self) { strings in
                    guard let first = strings.first else { return }
                    onPaste(first)
                }
            } else {
                Button(title) {}
                    .disabled(true)
            }
            #else
            Button(title) {}
                .disabled(true)
            #endif
        }
        .adaptiveButtonSizing(sizing)
        .adaptiveButtonTint(tint)
    }
}

/// A standard system edit button that toggles the editing state of a view.
public struct AdaptiveEditButton: View {
    public init() {}

    public var body: some View {
        #if os(iOS) || os(visionOS)
        EditButton()
        #else
        EmptyView()
        #endif
    }
}

/// A button that presents a menu of additional actions, with an optional primary action.
public struct AdaptiveMenuActionButton<Label: View, Content: View>: View {
    private let content: () -> Content
    private let label: () -> Label
    private let primaryAction: (() -> Void)?

    public init(
        @ViewBuilder content: @escaping () -> Content,
        @ViewBuilder label: @escaping () -> Label,
        primaryAction: (() -> Void)? = nil
    ) {
        self.content = content
        self.label = label
        self.primaryAction = primaryAction
    }

    @ViewBuilder
    public var body: some View {
        #if os(tvOS) || os(watchOS)
        fallbackMenu
        #else
        if let primaryAction {
            if #available(iOS 15.0, macOS 12.0, visionOS 1.0, *) {
                Menu {
                    content()
                } label: {
                    label()
                } primaryAction: {
                    primaryAction()
                }
            } else {
                fallbackMenu
            }
        } else {
            fallbackMenu
        }
        #endif
    }

    @ViewBuilder
    private var fallbackMenu: some View {
        #if os(tvOS)
        if #available(tvOS 17.0, *) {
            Menu {
                content()
            } label: {
                label()
            }
        } else {
            HStack {
                label()
                content()
            }
        }
        #elseif os(watchOS)
        HStack {
            label()
            content()
        }
        #else
        Menu {
            content()
        } label: {
            label()
        }
        #endif
    }
}

private extension AdaptiveButtonRole {
    var fallbackButtonRole: ButtonRole? {
        switch self {
        case .cancel:
            return .cancel
        case .close, .confirm:
            return nil
        case .destructive:
            return .destructive
        }
    }

    var fallbackTitle: LocalizedStringKey {
        switch self {
        case .cancel:
            return "Cancel"
        case .close:
            return "Close"
        case .confirm:
            return "Confirm"
        case .destructive:
            return "Delete"
        }
    }
}
