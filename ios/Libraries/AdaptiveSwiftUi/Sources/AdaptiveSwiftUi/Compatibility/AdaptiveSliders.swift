import SwiftUI

/// A type-erased container for slider tick information.
public struct AdaptiveSliderTickInfo: Identifiable, Sendable {
    public let id = UUID()
    public let value: Double
    public let label: AnyView?

    public init(_ value: Double, label: AnyView? = nil) {
        self.value = value
        self.label = label
    }
}

/// A structure that represents a tick in an adaptive slider.
public struct AdaptiveSliderTick: View {
    public let value: Double
    public let label: AnyView?

    public init(_ value: Double) {
        self.value = value
        self.label = nil
    }

    public init<V: View>(_ value: Double, @ViewBuilder label: () -> V) {
        self.value = value
        self.label = AnyView(label())
    }

    public var body: some View {
        EmptyView()
    }
}

/// A structure that creates slider ticks from a collection.
public struct AdaptiveSliderTickContentForEach<Data: RandomAccessCollection, ID: Hashable, Content: View>: View {
    public let data: Data
    public let id: KeyPath<Data.Element, ID>
    public let content: (Data.Element) -> Content

    public init(_ data: Data, id: KeyPath<Data.Element, ID>, @ViewBuilder content: @escaping (Data.Element) -> Content) {
        self.data = data
        self.id = id
        self.content = content
    }

    public var body: some View {
        EmptyView()
    }
}

extension View {
    /// Applies a tint color to a slider, with fallback for older OS versions.
    @ViewBuilder
    public func adaptiveSliderTint(_ color: Color?) -> some View {
        if let color = color {
            if #available(iOS 15.0, macOS 12.0, watchOS 8.0, tvOS 15.0, *) {
                self.tint(color)
            } else {
                self.accentColor(color)
            }
        } else {
            self
        }
    }
}
