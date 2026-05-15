import SwiftUI

/// An adaptive label component that provides platform-agnostic icon and title rendering.
///
/// `AdaptiveLabel` handles the transition between iOS 13 and modern OS versions:
/// - **Modern OS (iOS 14+)**: Leverages the native `Label` component.
/// - **Legacy Fallback (iOS 13)**: Polyfills using an `HStack` with standardized spacing 
///   to ensure visual parity.
///
/// Example:
/// ```swift
/// AdaptiveLabel("Profile", systemImage: "person.circle")
///     .adaptiveLabelStyle(.titleAndIcon)
/// ```
public struct AdaptiveLabel<Title: View, Icon: View>: View {
    let title: Title
    let icon: Icon

    @Environment(\.adaptiveLabelStyle) private var style: AdaptiveLabelStyleType

    /// Creates an adaptive label with custom title and icon views.
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
    /// Creates an adaptive label using a localized title key and a system image name.
    init(_ titleKey: LocalizedStringKey, systemImage: String) {
        self.init(title: { Text(titleKey) }, icon: { Image(systemName: systemImage) })
    }
    
    /// Creates an adaptive label using a localized title key and a custom image name.
    init(_ titleKey: LocalizedStringKey, image: String) {
        self.init(title: { Text(titleKey) }, icon: { Image(image) })
    }
}

public extension AdaptiveLabel where Title == Text, Icon == Image {
    /// Creates an adaptive label using a title string and a system image name.
    init<S: StringProtocol>(_ title: S, systemImage: String) {
        self.init(title: { Text(title) }, icon: { Image(systemName: systemImage) })
    }
    
    /// Creates an adaptive label using a title string and a custom image name.
    init<S: StringProtocol>(_ title: S, image: String) {
        self.init(title: { Text(title) }, icon: { Image(image) })
    }
}

// MARK: - Environment & Modifier

private struct AdaptiveLabelStyleKey: EnvironmentKey {
    static let defaultValue: AdaptiveLabelStyleType = .automatic
}

public extension EnvironmentValues {
    /// The current adaptive label style in the environment.
    var adaptiveLabelStyle: AdaptiveLabelStyleType {
        get { self[AdaptiveLabelStyleKey.self] }
        set { self[AdaptiveLabelStyleKey.self] = newValue }
    }
}

public extension View {
    /// Sets the adaptive label style for this view and its subviews.
    ///
    /// This modifier works with both `AdaptiveLabel` and the native SwiftUI `Label`.
    ///
    /// Example:
    /// ```swift
    /// MyView()
    ///     .adaptiveLabelStyle(.iconOnly)
    /// ```
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
