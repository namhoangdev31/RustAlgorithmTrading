import SwiftUI

/// A component that groups related controls together, providing a unified appearance.
/// Automatically falls back to a custom layout on OS versions where `ControlGroup` is unavailable.
public struct AdaptiveControlGroup<Content: View, Label: View>: View {
    let content: () -> Content
    let label: (() -> Label)?
    
    public init(@ViewBuilder content: @escaping () -> Content) where Label == EmptyView {
        self.content = content
        self.label = nil
    }
    
    public init(@ViewBuilder content: @escaping () -> Content, @ViewBuilder label: @escaping () -> Label) {
        self.content = content
        self.label = label
    }
    
    public init(_ titleKey: LocalizedStringKey, @ViewBuilder content: @escaping () -> Content) where Label == Text {
        self.content = content
        self.label = { Text(titleKey) }
    }
    
    public init<S: StringProtocol>(_ title: S, @ViewBuilder content: @escaping () -> Content) where Label == Text {
        self.content = content
        self.label = { Text(title) }
    }

    @Environment(\.adaptiveControlGroupStyleType) private var styleType
    
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
            ControlGroup(content: content, label: label)
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
