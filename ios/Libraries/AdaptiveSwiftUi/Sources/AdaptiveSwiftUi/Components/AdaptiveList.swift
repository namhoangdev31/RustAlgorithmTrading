import SwiftUI

public struct AdaptiveList<Content: View>: View {
    private let style: AdaptiveListStyleType
    private let content: () -> Content

    public init(
        style: AdaptiveListStyleType = .automatic,
        @ViewBuilder content: @escaping () -> Content
    ) {
        self.style = style
        self.content = content
    }

    public var body: some View {
        List {
            content()
        }
        .adaptiveListStyle(style)
    }
}

public extension AdaptiveList {
    /// Initializer for data-driven lists without selection
    init<Data: RandomAccessCollection, RowContent: View>(
        _ data: Data,
        style: AdaptiveListStyleType = .automatic,
        @ViewBuilder rowContent: @escaping (Data.Element) -> RowContent
    ) where Content == ForEach<Data, Data.Element.ID, RowContent>, Data.Element: Identifiable {
        self.style = style
        self.content = { ForEach(data, content: rowContent) }
    }
}
