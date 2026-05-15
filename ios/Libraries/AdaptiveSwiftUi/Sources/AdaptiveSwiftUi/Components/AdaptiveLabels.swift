import SwiftUI

/// An adaptive label style type to match native `LabelStyle`.
public enum AdaptiveLabelStyleType: Sendable {
    case automatic
    case iconOnly
    case titleAndIcon
    case titleOnly
}

/// An adaptive label component that provides a fallback to an `HStack` of icon and title on iOS 13,
/// and uses the native `Label` on iOS 14+.
public struct AdaptiveLabel<Title: View, Icon: View>: View {
    let title: Title
    let icon: Icon

    @Environment(\.adaptiveLabelStyle) private var style: AdaptiveLabelStyleType

    public init(@ViewBuilder title: () -> Title, @ViewBuilder icon: () -> Icon) {
        self.title = title()
        self.icon = icon()
    }

    public var body: some View {
        if #available(iOS 14.0, macOS 11.0, watchOS 7.0, tvOS 14.0, visionOS 1.0, *) {
            Label(title: { title }, icon: { icon })
                .applyNativeLabelStyle(style)
        } else {
            fallback
        }
    }

    @ViewBuilder
    private var fallback: some View {
        switch style {
        case .iconOnly:
            icon
        case .titleOnly:
            title
        case .titleAndIcon, .automatic:
            HStack(spacing: 8) {
                icon
                title
            }
        }
    }
}

public extension AdaptiveLabel where Title == Text, Icon == Image {
    init(_ titleKey: LocalizedStringKey, systemImage: String) {
        self.init(title: { Text(titleKey) }, icon: { Image(systemName: systemImage) })
    }
    
    init(_ titleKey: LocalizedStringKey, image: String) {
        self.init(title: { Text(titleKey) }, icon: { Image(image) })
    }
}

public extension AdaptiveLabel where Title == Text, Icon == Image {
    init<S: StringProtocol>(_ title: S, systemImage: String) {
        self.init(title: { Text(title) }, icon: { Image(systemName: systemImage) })
    }
    
    init<S: StringProtocol>(_ title: S, image: String) {
        self.init(title: { Text(title) }, icon: { Image(image) })
    }
}

// MARK: - Environment & Modifier

private struct AdaptiveLabelStyleKey: EnvironmentKey {
    static let defaultValue: AdaptiveLabelStyleType = .automatic
}

public extension EnvironmentValues {
    var adaptiveLabelStyle: AdaptiveLabelStyleType {
        get { self[AdaptiveLabelStyleKey.self] }
        set { self[AdaptiveLabelStyleKey.self] = newValue }
    }
}

public extension View {
    /// Applies an adaptive label style to the view.
    /// This works with both `AdaptiveLabel` on iOS 13 and native `Label` on iOS 14+.
    @ViewBuilder
    func adaptiveLabelStyle(_ style: AdaptiveLabelStyleType) -> some View {
        if #available(iOS 14.0, macOS 11.0, watchOS 7.0, tvOS 14.0, visionOS 1.0, *) {
            self.environment(\.adaptiveLabelStyle, style)
                .applyNativeLabelStyle(style)
        } else {
            self.environment(\.adaptiveLabelStyle, style)
        }
    }
}

@available(iOS 14.0, macOS 11.0, watchOS 7.0, tvOS 14.0, visionOS 1.0, *)
fileprivate extension View {
    @ViewBuilder
    func applyNativeLabelStyle(_ style: AdaptiveLabelStyleType) -> some View {
        switch style {
        case .iconOnly:
            self.labelStyle(.iconOnly)
        case .titleOnly:
            self.labelStyle(.titleOnly)
        case .titleAndIcon:
            self.labelStyle(.titleAndIcon)
        case .automatic:
            self.labelStyle(.automatic)
        }
    }
}
