import SwiftUI

// MARK: - Label & Text Enums

/// An adaptive label style type to match native `LabelStyle`.
///
/// Example:
/// ```swift
/// AdaptiveLabel("Home", systemImage: "house")
///     .adaptiveLabelStyle(.titleAndIcon)
/// ```
public enum AdaptiveLabelStyleType: Sendable {
    case automatic
    case iconOnly
    case titleAndIcon
    case titleOnly
}

/// Defines number formatting options for `AdaptiveText`.
///
/// Example:
/// ```swift
/// AdaptiveText(1234.56, format: .currency(code: "USD"))
/// AdaptiveText(0.75, format: .percent)
/// ```
public enum AdaptiveNumberFormat: Sendable {
    case currency(code: String)
    case percent
    case decimal(fractionLength: Int? = nil, grouping: Bool = true, scientific: Bool = false)
}

/// Defines width styles for measurement formatting.
///
/// Example:
/// ```swift
/// AdaptiveText(measurement, width: .abbreviated) // "5 kg"
/// AdaptiveText(measurement, width: .wide)        // "5 kilograms"
/// ```
public enum AdaptiveMeasurementWidth: Sendable {
    case wide
    case narrow
    case abbreviated
}

/// Defines patterns for time duration formatting.
///
/// Example:
/// ```swift
/// AdaptiveText(seconds: 3660, pattern: .hourMinute) // "1:01"
/// ```
public enum AdaptiveTimePattern: Sendable {
    case hourMinute
    case minuteSecond
}

// MARK: - Button & Control Enums

/// Defines semantic roles for adaptive buttons.
public enum AdaptiveButtonRole: Sendable {
    case cancel
    case close
    case confirm
    case destructive
}

/// Defines sizing behaviors for adaptive buttons.
public enum AdaptiveButtonSizing: Sendable {
    case automatic
    case fitted
    case flexible
}

/// Defines visual styles for adaptive buttons, including polyfilled glass styles.
///
/// Example:
/// ```swift
/// AdaptiveButton("Click Me") {}
///     .adaptiveButtonStyle(.glassProminent)
/// ```
public enum AdaptiveButtonStyle: Sendable {
    case automatic
    case plain
    case borderless
    case bordered
    case borderedProminent
    case glass
    case glassProminent
}

/// An adaptive control size type to match native `ControlSize`.
///
/// Example:
/// ```swift
/// AdaptiveButton("Small") {}
///     .adaptiveControlSize(.small)
/// ```
public enum AdaptiveControlSize: Sendable {
    case mini
    case small
    case regular
    case large
    case extraLarge

    @available(iOS 15.0, macOS 10.15, tvOS 15.0, watchOS 9.0, visionOS 1.0, *)
    public var native: ControlSize {
        switch self {
        case .mini: return .mini
        case .small: return .small
        case .regular: return .regular
        case .large: return .large
        case .extraLarge:
            #if os(visionOS)
                return .extraLarge
            #else
                if #available(iOS 17.0, macOS 14.0, tvOS 17.0, watchOS 10.0, *) {
                    return .extraLarge
                } else {
                    return .large
                }
            #endif
        }
    }
}

/// Defines border shapes for adaptive buttons.
public enum AdaptiveButtonBorderShape: Sendable {
    case automatic
    case roundedRectangle
    case capsule
    case circle
    case roundedRectangleRadius(CGFloat)
}

/// Defines hierarchical importance levels for views (Primary, Secondary, etc.).
public enum AdaptiveHierarchicalVariant: Sendable {
    case primary
    case secondary
    case tertiary
    case quaternary
    case quinary
}

// MARK: - Material & Effect Enums

/// Defines standard levels of material thickness.
///
/// Example:
/// ```swift
/// MyView()
///     .adaptiveBackgroundMaterial(.thin)
/// ```
public enum AdaptiveMaterialType: Sendable {
    case ultraThin
    case thin
    case regular
    case thick
    case ultraThick
}

/// Defines material styles for background fills.
public enum AdaptiveMaterialStyle: Sendable {
    case ultraThin
    case thin
    case regular
    case thick
    case ultraThick
}

/// Defines variants for glass effect buttons.
public enum AdaptiveGlassButtonVariant: Sendable {
    case regular
    case prominent
}

/// Defines semantic hierarchical levels for color styles.
public enum AdaptiveColorHierarchy: Sendable {
    case primary
    case secondary
    case tertiary
    case quaternary
    case quinary
}

// MARK: - Layout & Container Enums

/// Defines axes for `AdaptiveViewThatFits`.
public enum AdaptiveViewThatFitsAxes: Sendable {
    case horizontal
    case vertical
    case all

    @available(iOS 16.0, macOS 13.0, watchOS 9.0, tvOS 16.0, *)
    public var native: Axis.Set {
        switch self {
        case .horizontal: return .horizontal
        case .vertical: return .vertical
        case .all: return [.horizontal, .vertical]
        }
    }
}

/// Defines placements for container background styles.
public enum AdaptiveContainerBackgroundPlacement: Sendable {
    case navigation
    case navigationSplitView

    #if os(iOS) || os(watchOS)
        @available(iOS 18.0, watchOS 10.0, *)
        public var native: ContainerBackgroundPlacement {
            switch self {
            case .navigation:
                return .navigation
            case .navigationSplitView:
                if #available(iOS 18.0, watchOS 11.0, *) {
                    return .navigationSplitView
                } else {
                    return .navigation
                }
            }
        }
    #endif
}

/// Defines edge effect styles for scroll views.
public enum AdaptiveScrollEdgeEffectStyle: Sendable {
    case hard
}

// MARK: - Style Enums

/// Defines visual styles for `AdaptiveProgressView`.
public enum AdaptiveProgressViewStyle: Sendable {
    case automatic
    case linear
    case circular
}

/// Defines ordering behaviors for adaptive menus.
public enum AdaptiveMenuOrder: Sendable {
    case automatic
    case fixed
    case priority
}

/// Defines visual styles for `AdaptiveControlGroup`.
public enum AdaptiveControlGroupStyle: Sendable {
    case automatic
    case navigation
    case menu
    case compactMenu
    case palette
}

/// Defines visual styles for `AdaptiveDatePicker`.
public enum AdaptiveDatePickerStyle: Sendable {
    case automatic
    case wheel
    case graphical
    case field
    case stepperField
}

/// Defines visual styles for `AdaptivePicker`.
public enum AdaptivePickerStyle: Sendable {
    case automatic
    case menu
    case inline
    case navigationLink
    case palette
    case segmented
    case wheel
    case radioGroup
}

/// Defines visual styles for `AdaptiveGauge`.
public enum AdaptiveGaugeStyle: Sendable {
    case automatic
    case linear
    case linearCapacity
    case circular
    case accessoryLinear
    case accessoryLinearCapacity
    case accessoryCircular
    case accessoryCircularCapacity
}

// MARK: - List & Sheet Enums

/// Defines visual styles for `AdaptiveList`.
public enum AdaptiveListStyleType: Sendable {
    case automatic
    case plain
    case grouped
    case insetGrouped
    case sidebar
    case inset
    case elliptical  // watchOS
    case carousel  // watchOS
    case bordered  // macOS
}

/// Defines section spacing for lists.
public enum AdaptiveListSectionSpacing: Sendable {
    case `default`
    case compact
    case custom(CGFloat)
}

/// Defines background prominence for list items.
public enum AdaptiveBackgroundProminence: Sendable {
    case standard
    case increased
}

/// Defines badge prominence for list items.
public enum AdaptiveBadgeProminence: Sendable {
    case standard
    case increased
}

/// Defines sizing behaviors for adaptive sheets.
public enum AdaptiveSheetSizing: Sendable {
    case automatic
    case fitted
    case page
}

/// Defines presentation detents for adaptive sheets.
public enum AdaptivePresentationDetent: Hashable, Sendable {
    case medium
    case large
    case fraction(CGFloat)
    case height(CGFloat)
}

/// Defines background interaction behaviors for adaptive sheets.
public enum AdaptivePresentationBackgroundInteraction: Sendable {
    case automatic
    case enabled
    case disabled
    case enabledUpThrough(AdaptivePresentationDetent)
}

/// Defines content interaction behaviors for adaptive sheets.
public enum AdaptivePresentationContentInteraction: Sendable {
    case automatic
    case scrolls
    case resizes
}

// MARK: - Toolbar & TabView Enums

/// Defines title placements for adaptive toolbars.
public enum AdaptiveToolbarTitlePlacement: Sendable {
    case automatic
    case title
    case subtitle
    case largeTitle
    case largeSubtitle
}

/// Defines spacer sizing behaviors for adaptive toolbars.
public enum AdaptiveToolbarSpacerSizing: Sendable {
    case fixed
    case flexible
}

/// Defines kinds of default toolbar items for adaptive removal or customization.
public enum AdaptiveToolbarDefaultItemKind: Sendable {
    case sidebarToggle
    case title
    case search
}

/// Defines visual styles for `AdaptiveTabView`.
public enum AdaptiveTabViewStyle: Sendable {
    case automatic
    case sidebarAdaptable
    case tabBarOnly
    case grouped
    case page(indexDisplayMode: AdaptivePageTabIndexDisplayMode = .automatic)
    case verticalPage
}

/// Defines index display modes for page tab styles.
public enum AdaptivePageTabIndexDisplayMode: Sendable {
    case automatic, always, never
}

/// Defines minimize behaviors for the tab bar on scroll.
public enum AdaptiveTabBarMinimizeBehavior: Sendable {
    case automatic, never, onScrollDown, onScrollUp
}

/// Defines adaptable placement behaviors for the tab bar.
public enum AdaptiveAdaptableTabBarPlacement: Sendable {
    case automatic, sidebar, tabBar
}

/// Defines placement behaviors for tab view bottom accessories.
public enum AdaptiveBottomAccessoryPlacement: Sendable {
    case inline, expanded, none
}

/// Defines customization placements for tabs.
@available(iOS 18.0, macOS 15.0, tvOS 18.0, watchOS 11.0, visionOS 2.0, *)
public enum AdaptiveTabCustomizationPlacement: Hashable, Sendable {
    case automatic, tabBar, sidebar
}

/// Defines customization behaviors for tabs.
@available(iOS 18.0, macOS 15.0, tvOS 18.0, watchOS 11.0, visionOS 2.0, *)
public enum AdaptiveTabCustomizationBehavior: Sendable {
    case automatic, reorderable, disabled
}

/// Defines semantic roles for tabs.
@available(iOS 18.0, macOS 15.0, tvOS 18.0, watchOS 11.0, visionOS 2.0, *)
public enum AdaptiveTabRole: Sendable {
    case automatic, search
}
