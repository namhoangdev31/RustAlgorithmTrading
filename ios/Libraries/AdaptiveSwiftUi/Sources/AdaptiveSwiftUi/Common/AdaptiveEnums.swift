import SwiftUI

// MARK: - Label & Text Enums

/// An adaptive label style type to match native `LabelStyle`.
public enum AdaptiveLabelStyleType: Sendable {
    case automatic
    case iconOnly
    case titleAndIcon
    case titleOnly
}

public enum AdaptiveNumberFormat: Sendable {
    case currency(code: String)
    case percent
    case decimal(fractionLength: Int? = nil, grouping: Bool = true, scientific: Bool = false)
}

public enum AdaptiveMeasurementWidth: Sendable {
    case wide
    case narrow
    case abbreviated
}

public enum AdaptiveTimePattern: Sendable {
    case hourMinute
    case minuteSecond
}

// MARK: - Button & Control Enums

public enum AdaptiveButtonRole: Sendable {
    case cancel
    case close
    case confirm
    case destructive
}

public enum AdaptiveButtonSizing: Sendable {
    case automatic
    case fitted
    case flexible
}

public enum AdaptiveButtonStyle: Sendable {
    case automatic
    case plain
    case borderless
    case bordered
    case borderedProminent
    case glass
    case glassProminent
}

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

public enum AdaptiveButtonBorderShape: Sendable {
    case automatic
    case roundedRectangle
    case capsule
    case circle
    case roundedRectangleRadius(CGFloat)
}

public enum AdaptiveHierarchicalVariant: Sendable {
    case primary
    case secondary
    case tertiary
    case quaternary
    case quinary
}

// MARK: - Material & Effect Enums

/// Defines the five standard levels of material thickness.
public enum AdaptiveMaterialType: Sendable {
    case ultraThin
    case thin
    case regular
    case thick
    case ultraThick
}

public enum AdaptiveMaterialStyle: Sendable {
    case ultraThin
    case thin
    case regular
    case thick
    case ultraThick
}

public enum AdaptiveGlassButtonVariant: Sendable {
    case regular
    case prominent
}

public enum AdaptiveColorHierarchy: Sendable {
    case primary
    case secondary
    case tertiary
    case quaternary
    case quinary
}

// MARK: - Layout & Container Enums

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

public enum AdaptiveScrollEdgeEffectStyle: Sendable {
    case hard
}

// MARK: - Style Enums

public enum AdaptiveProgressViewStyle: Sendable {
    case automatic
    case linear
    case circular
}

public enum AdaptiveMenuOrder: Sendable {
    case automatic
    case fixed
    case priority
}

public enum AdaptiveControlGroupStyle: Sendable {
    case automatic
    case navigation
    case menu
    case compactMenu
    case palette
}

public enum AdaptiveDatePickerStyle: Sendable {
    case automatic
    case wheel
    case graphical
    case field
    case stepperField
}

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

public enum AdaptiveListSectionSpacing: Sendable {
    case `default`
    case compact
    case custom(CGFloat)
}

public enum AdaptiveBackgroundProminence: Sendable {
    case standard
    case increased
}

public enum AdaptiveBadgeProminence: Sendable {
    case standard
    case increased
}

public enum AdaptiveSheetSizing: Sendable {
    case automatic
    case fitted
    case page
}

public enum AdaptivePresentationDetent: Hashable, Sendable {
    case medium
    case large
    case fraction(CGFloat)
    case height(CGFloat)
}

public enum AdaptivePresentationBackgroundInteraction: Sendable {
    case automatic
    case enabled
    case disabled
    case enabledUpThrough(AdaptivePresentationDetent)
}

public enum AdaptivePresentationContentInteraction: Sendable {
    case automatic
    case scrolls
    case resizes
}

// MARK: - Toolbar & TabView Enums

public enum AdaptiveToolbarTitlePlacement: Sendable {
    case automatic
    case title
    case subtitle
    case largeTitle
    case largeSubtitle
}

public enum AdaptiveToolbarSpacerSizing: Sendable {
    case fixed
    case flexible
}

public enum AdaptiveTabViewStyle: Sendable {
    case automatic
    case sidebarAdaptable
    case tabBarOnly
    case grouped
    case page(indexDisplayMode: AdaptivePageTabIndexDisplayMode = .automatic)
    case verticalPage
}

public enum AdaptivePageTabIndexDisplayMode: Sendable {
    case automatic, always, never
}

public enum AdaptiveTabBarMinimizeBehavior: Sendable {
    case automatic, never, onScrollDown, onScrollUp
}

public enum AdaptiveAdaptableTabBarPlacement: Sendable {
    case automatic, sidebar, tabBar
}

public enum AdaptiveBottomAccessoryPlacement: Sendable {
    case inline, expanded, none
}

@available(iOS 18.0, macOS 15.0, tvOS 18.0, watchOS 11.0, visionOS 2.0, *)
public enum AdaptiveTabCustomizationPlacement: Hashable, Sendable {
    case automatic, tabBar, sidebar
}

@available(iOS 18.0, macOS 15.0, tvOS 18.0, watchOS 11.0, visionOS 2.0, *)
public enum AdaptiveTabCustomizationBehavior: Sendable {
    case automatic, reorderable, disabled
}

@available(iOS 18.0, macOS 15.0, tvOS 18.0, watchOS 11.0, visionOS 2.0, *)
public enum AdaptiveTabRole: Sendable {
    case automatic, search
}
