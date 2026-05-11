import Foundation

/// iOS doesn't need KMP's DispatcherProvider — Swift concurrency handles this natively.
/// This exists only for interface parity if needed.
enum AppDispatcher {
    static let main = DispatchQueue.main
    static let io = DispatchQueue(label: "com.lepos.lepos.io", qos: .userInitiated, attributes: .concurrent)
    static let background = DispatchQueue.global(qos: .background)
}
