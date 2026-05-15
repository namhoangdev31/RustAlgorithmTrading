import SwiftUI

/// A container that groups related controls together with a unified visual appearance.
///
/// `AdaptiveControlGroup` provides a bridge for the `ControlGroup` API:
/// - **Modern OS (iOS 15+)**: Uses the native `ControlGroup` component.
/// - **Legacy Fallback**: Automatically adapts to a `Menu` or a custom `HStack` with 
///   a background plate depending on the current `adaptiveControlGroupStyle`.
///
/// Example:
/// ```swift
/// AdaptiveControlGroup("Edit") {
///     Button("Copy", systemImage: "doc.on.doc") { }
///     Button("Paste", systemImage: "doc.on.clipboard") { }
/// }
/// ```
public struct AdaptiveControlGroup<Content: View, Label: View>: View {
    let content: () -> Content
    let label: (() -> Label)?

    /// Creates a control group with only content.
    public init(@ViewBuilder content: @escaping () -> Content) where Label == EmptyView {
        self.content = content
        self.label = nil
    }

    /// Creates a control group with content and a custom label view.
    public init(
        @ViewBuilder content: @escaping () -> Content, @ViewBuilder label: @escaping () -> Label
    ) {
        self.content = content
        self.label = label
    }

    /// Creates a control group with a localized title.
    public init(_ titleKey: LocalizedStringKey, @ViewBuilder content: @escaping () -> Content)
    where Label == Text {
        self.content = content
        self.label = { Text(titleKey) }
    }

    /// Creates a control group with a title and system image.
    public init(
        _ titleKey: LocalizedStringKey, systemImage: String,
        @ViewBuilder content: @escaping () -> Content
    ) where Label == SwiftUI.Label<Text, Image> {
        self.content = content
        self.label = { SwiftUI.Label(titleKey, systemImage: systemImage) }
    }

    /// Creates a control group with a string title.
    public init<S: StringProtocol>(_ title: S, @ViewBuilder content: @escaping () -> Content)
    where Label == Text {
        self.content = content
        self.label = { Text(title) }
    }

    @Environment(\.adaptiveControlGroupStyle) private var styleType

    public var body: some View {
        #if os(iOS) || os(macOS) || os(tvOS) || os(visionOS) || os(watchOS)
            if #available(iOS 15.0, macOS 12.0, tvOS 17.0, visionOS 1.0, *) {
                #if !os(watchOS)
                    nativeGroup
                #else
                    fallbackView
                #endif
            } else {
                fallbackView
            }
        #else
            fallbackView
        #endif
    }

    #if os(iOS) || os(macOS) || os(tvOS) || os(visionOS)
        @available(iOS 15.0, macOS 12.0, tvOS 17.0, visionOS 1.0, *)
        @ViewBuilder
        private var nativeGroup: some View {
            if let label = label {
                if #available(iOS 16.0, macOS 13.0, tvOS 17.0, *) {
                    ControlGroup(content: content, label: label)
                } else {
                    VStack(alignment: .leading, spacing: 4) {
                        label()
                        ControlGroup(content: content)
                    }
                }
            } else {
                ControlGroup(content: content)
            }
        }
    #endif

    @ViewBuilder
    private var fallbackView: some View {
        switch styleType {
        case .menu, .compactMenu:
            if #available(iOS 14.0, macOS 11.0, tvOS 17.0, watchOS 7.0, *) {
                Menu {
                    content()
                } label: {
                    if let label = label {
                        label()
                    } else {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            } else {
                fallbackHStack
            }
        default:
            fallbackHStack
        }
    }

    private var fallbackHStack: some View {
        VStack(alignment: .leading, spacing: 4) {
            if let label = label {
                label()
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            HStack(spacing: 8) {
                // In iOS 13/14, we don't have access to the tuple children easily to insert dividers,
                // so we rely on horizontal spacing and a grouped background block.
                content()
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(Color.secondary.opacity(0.15))
            .cornerRadius(8)
        }
    }
}

/// A specialized control group with a title and system image.
public struct AdaptiveControlGroupTitled<Content: View>: View {
    private let titleKey: LocalizedStringKey
    private let systemImage: String
    private let content: () -> Content

    public init(
        _ titleKey: LocalizedStringKey,
        systemImage: String,
        @ViewBuilder content: @escaping () -> Content
    ) {
        self.titleKey = titleKey
        self.systemImage = systemImage
        self.content = content
    }

    @ViewBuilder
    public var body: some View {
        AdaptiveControlGroup(titleKey, systemImage: systemImage, content: content)
    }
}

/// A specialized control group with a custom label view.
public struct AdaptiveControlGroupLabeled<Content: View, Label: View>: View {
    private let content: () -> Content
    private let label: () -> Label

    public init(
        @ViewBuilder content: @escaping () -> Content,
        @ViewBuilder label: @escaping () -> Label
    ) {
        self.content = content
        self.label = label
    }

    @ViewBuilder
    public var body: some View {
        AdaptiveControlGroup(content: content, label: label)
    }
}
