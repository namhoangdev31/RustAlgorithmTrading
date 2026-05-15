import SwiftUI

public extension View {
    
    /// Sets the adaptive sizing behavior for presented sheets.
    ///
    /// Available on modern systems (iOS 18+, macOS 15+, etc.).
    /// Fallbacks gracefully on older systems.
    ///
    /// Example:
    /// ```swift
    /// View()
    ///     .adaptivePresentationSizing(.fitted)
    /// ```
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

    /// Sets the available detents for an adaptive sheet presentation.
    ///
    /// This modifier handles cross-platform mapping for sheet heights (detents):
    /// - **iOS 16+ / macOS 13+**: Maps to native `.presentationDetents()`.
    /// - **Legacy Fallback**: Gracefully ignores the modifier on older systems.
    ///
    /// Example:
    /// ```swift
    /// MySheetContent()
    ///     .adaptivePresentationDetents([.medium, .large])
    /// ```
    @ViewBuilder
    func adaptivePresentationDetents(_ detents: [AdaptivePresentationDetent]) -> some View {
        if #available(iOS 16.0, macOS 13.0, tvOS 16.0, watchOS 9.0, visionOS 1.0, *) {
            self.presentationDetents(Set(detents.map(\.swiftUIDetent)))
        } else {
            self
        }
    }

    /// Sets the available detents with a binding for selection.
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

    /// Sets the corner radius for an adaptive sheet presentation.
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

    /// Sets the background style for an adaptive sheet presentation.
    ///
    /// Example:
    /// ```swift
    /// MySheet()
    ///     .adaptivePresentationBackground(.ultraThinMaterial)
    /// ```
    @ViewBuilder
    func adaptivePresentationBackground<S: ShapeStyle>(_ style: S) -> some View {
        if #available(iOS 16.4, macOS 13.3, tvOS 16.4, watchOS 9.4, visionOS 1.0, *) {
            self.presentationBackground(style)
        } else {
            self
        }
    }

    /// Configures the interaction behavior for the background of a sheet.
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

    /// Configures the interaction behavior for the content of a sheet.
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

    /// Controls the visibility of the drag indicator on a sheet.
    @ViewBuilder
    func adaptivePresentationDragIndicator(_ visibility: Visibility = .automatic) -> some View {
        if #available(iOS 16.0, macOS 13.0, tvOS 16.0, watchOS 9.0, visionOS 1.0, *) {
            self.presentationDragIndicator(visibility)
        } else {
            self
        }
    }

    /// Controls whether interactive dismissal of a sheet is disabled.
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
