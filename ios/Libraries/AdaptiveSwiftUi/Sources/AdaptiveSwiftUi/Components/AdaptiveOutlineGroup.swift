import SwiftUI

public struct AdaptiveOutlineGroup<Data: RandomAccessCollection, ID: Hashable, Parent: View, Leaf: View>: View where Data.Element: Identifiable, Data.Element.ID == ID {
    private let data: Data
    private let children: KeyPath<Data.Element, Data?>
    private let content: (Data.Element) -> Parent
    private let isLeaf: Bool

    public init(
        _ data: Data,
        children: KeyPath<Data.Element, Data?>,
        @ViewBuilder content: @escaping (Data.Element) -> Parent
    ) where Leaf == EmptyView {
        self.data = data
        self.children = children
        self.content = content
        self.isLeaf = true
    }

    public var body: some View {
        if #available(iOS 14.0, macOS 11.0, visionOS 1.0, *) {
            OutlineGroup(data, children: children, content: content)
        } else {
            // Fallback for older OS: simple list representation without nested expanding
            ForEach(data) { item in
                content(item)
            }
        }
    }
}
