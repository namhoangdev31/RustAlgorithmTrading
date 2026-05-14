import SwiftUI

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

public extension View {
    @ViewBuilder
    func adaptivePresentationSizing(_ sizing: AdaptiveSheetSizing) -> some View {
        if #available(iOS 18.0, macOS 15.0, tvOS 18.0, watchOS 11.0, visionOS 2.0, *) {
            switch sizing {
            case .automatic:
                self.presentationSizing(.automatic)
            case .fitted:
                self.presentationSizing(.fitted)
            case .page:
                self.presentationSizing(.page)
            }
        } else {
            self
        }
    }

    @ViewBuilder
    func adaptivePresentationDetents(_ detents: [AdaptivePresentationDetent]) -> some View {
        if #available(iOS 16.0, macOS 13.0, tvOS 16.0, watchOS 9.0, visionOS 1.0, *) {
            self.presentationDetents(Set(detents.map(\.swiftUIDetent)))
        } else {
            self
        }
    }

    @ViewBuilder
    func adaptivePresentationDetents(
        _ detents: [AdaptivePresentationDetent],
        selection: Binding<AdaptivePresentationDetent>
    ) -> some View {
        if #available(iOS 16.0, macOS 13.0, tvOS 16.0, watchOS 9.0, visionOS 1.0, *) {
            let mappedDetents = Set(detents.map(\.swiftUIDetent))
            let mappedSelection = Binding<PresentationDetent>(
                get: {
                    selection.wrappedValue.swiftUIDetent
                },
                set: { newValue in
                    if let match = detents.first(where: { $0.swiftUIDetent == newValue }) {
                        selection.wrappedValue = match
                    }
                }
            )

            self.presentationDetents(mappedDetents, selection: mappedSelection)
        } else {
            self
        }
    }

    @ViewBuilder
    func adaptivePresentationCornerRadius(_ radius: CGFloat?) -> some View {
        if let radius {
            if #available(iOS 16.4, macOS 13.3, tvOS 16.4, watchOS 9.4, visionOS 1.0, *) {
                self.presentationCornerRadius(radius)
            } else {
                self
            }
        } else {
            self
        }
    }

    @ViewBuilder
    func adaptivePresentationBackground<S: ShapeStyle>(_ style: S) -> some View {
        if #available(iOS 16.4, macOS 13.3, tvOS 16.4, watchOS 9.4, visionOS 1.0, *) {
            self.presentationBackground(style)
        } else {
            self
        }
    }

    @ViewBuilder
    func adaptivePresentationBackgroundInteraction(
        _ interaction: AdaptivePresentationBackgroundInteraction
    ) -> some View {
        if #available(iOS 16.4, macOS 13.3, tvOS 16.4, watchOS 9.4, visionOS 1.0, *) {
            switch interaction {
            case .automatic:
                self.presentationBackgroundInteraction(.automatic)
            case .enabled:
                self.presentationBackgroundInteraction(.enabled)
            case .disabled:
                self.presentationBackgroundInteraction(.disabled)
            case let .enabledUpThrough(detent):
                self.presentationBackgroundInteraction(.enabled(upThrough: detent.swiftUIDetent))
            }
        } else {
            self
        }
    }

    @ViewBuilder
    func adaptivePresentationContentInteraction(
        _ interaction: AdaptivePresentationContentInteraction
    ) -> some View {
        if #available(iOS 16.4, macOS 13.3, tvOS 16.4, watchOS 9.4, visionOS 1.0, *) {
            switch interaction {
            case .automatic:
                self.presentationContentInteraction(.automatic)
            case .scrolls:
                self.presentationContentInteraction(.scrolls)
            case .resizes:
                self.presentationContentInteraction(.resizes)
            }
        } else {
            self
        }
    }

    @ViewBuilder
    func adaptivePresentationDragIndicator(_ visibility: Visibility = .automatic) -> some View {
        if #available(iOS 16.0, macOS 13.0, tvOS 16.0, watchOS 9.0, visionOS 1.0, *) {
            self.presentationDragIndicator(visibility)
        } else {
            self
        }
    }

    @ViewBuilder
    func adaptiveInteractiveDismissDisabled(_ isDisabled: Bool = true) -> some View {
        if #available(iOS 15.0, macOS 12.0, tvOS 15.0, watchOS 8.0, visionOS 1.0, *) {
            self.interactiveDismissDisabled(isDisabled)
        } else {
            self
        }
    }
}

@available(iOS 16.0, macOS 13.0, tvOS 16.0, watchOS 9.0, visionOS 1.0, *)
private extension AdaptivePresentationDetent {
    var swiftUIDetent: PresentationDetent {
        switch self {
        case .medium:
            return .medium
        case .large:
            return .large
        case let .fraction(value):
            return .fraction(value)
        case let .height(value):
            return .height(value)
        }
    }
}
