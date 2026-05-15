import SwiftUI

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
