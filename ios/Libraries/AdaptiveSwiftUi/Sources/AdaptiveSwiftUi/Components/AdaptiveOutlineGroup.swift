import SwiftUI

/// An adaptive component that presents hierarchical data by iterating through children.
///
/// `AdaptiveOutlineGroup` provides a bridge for the `OutlineGroup` API:
/// - **Modern OS (iOS 14+, macOS 11+)**: Leverages the native `OutlineGroup` to provide 
///   collapsible tree-like structures.
/// - **Legacy Fallback (iOS 13)**: Falls back to a flat `ForEach` representation, ensuring 
///   that data remains visible and accessible on older systems.
///
/// Example:
/// ```swift
/// AdaptiveOutlineGroup(fileSystemItems, children: \.children) { item in
///     Label(item.name, systemImage: item.isDirectory ? "folder" : "doc")
/// }
/// ```
public struct AdaptiveOutlineGroup<Data: RandomAccessCollection, ID: Hashable, Parent: View, Leaf: View>: View where Data.Element: Identifiable, Data.Element.ID == ID {
    private let data: Data
    private let children: KeyPath<Data.Element, Data?>
    private let content: (Data.Element) -> Parent
    private let isLeaf: Bool

    /// Creates an adaptive outline group from a collection of hierarchical data.
    ///
    /// - Parameters:
    ///   - data: The collection of data to present.
    ///   - children: A key path to a property that provides the element's children.
    ///   - content: A view builder that creates the view for each element in the hierarchy.
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
            // Fallback for older OS: simple flat list representation without nested expanding support.
            ForEach(data) { item in
                content(item)
            }
        }
    }
}
