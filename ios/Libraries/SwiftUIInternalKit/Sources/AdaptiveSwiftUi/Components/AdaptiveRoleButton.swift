import SwiftUI

public enum AdaptiveButtonRole: Sendable {
    case cancel
    case close
    case confirm
    case destructive
}

public struct AdaptiveRoleButton: View {
    private let role: AdaptiveButtonRole
    private let title: LocalizedStringKey?
    private let action: () -> Void

    public init(
        role: AdaptiveButtonRole,
        title: LocalizedStringKey? = nil,
        action: @escaping () -> Void
    ) {
        self.role = role
        self.title = title
        self.action = action
    }

    @ViewBuilder
    public var body: some View {
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

public struct AdaptiveRenameButton: View {
    private let title: LocalizedStringKey
    private let action: () -> Void

    public init(
        title: LocalizedStringKey = "Rename",
        action: @escaping () -> Void
    ) {
        self.title = title
        self.action = action
    }

    @ViewBuilder
    public var body: some View {
        if #available(iOS 16.0, macOS 13.0, watchOS 9.0, tvOS 16.0, visionOS 1.0, *) {
            RenameButton()
                .renameAction(action)
        } else {
            Button(title, action: action)
        }
    }
}

public struct AdaptivePasteButton: View {
    private let title: LocalizedStringKey
    private let onPaste: (String) -> Void

    public init(
        title: LocalizedStringKey = "Paste",
        onPaste: @escaping (String) -> Void
    ) {
        self.title = title
        self.onPaste = onPaste
    }

    @ViewBuilder
    public var body: some View {
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
}

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
