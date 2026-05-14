import Foundation

// Canonical OS generations used by the UI compatibility layer.
enum SupportedOSVersion: Int, CaseIterable {
    case v15 = 15
    case v16 = 16
    case v17 = 17
    case v18 = 18
    case v26 = 26
}

enum PlatformVersion {
    static var currentMajor: Int {
        ProcessInfo.processInfo.operatingSystemVersion.majorVersion
    }

    static func isAtLeast(_ version: SupportedOSVersion) -> Bool {
        currentMajor >= version.rawValue
    }

    // iPadOS shares the same availability gate as iOS.
    static var supportsWWDC25Glass: Bool {
        #if os(iOS)
        if #available(iOS 26.0, *) { return true }
        return false
        #elseif os(macOS)
        if #available(macOS 26.0, *) { return true }
        return false
        #elseif os(watchOS)
        if #available(watchOS 26.0, *) { return true }
        return false
        #elseif os(tvOS)
        if #available(tvOS 26.0, *) { return true }
        return false
        #elseif os(visionOS)
        if #available(visionOS 26.0, *) { return true }
        return false
        #else
        return false
        #endif
    }
}
