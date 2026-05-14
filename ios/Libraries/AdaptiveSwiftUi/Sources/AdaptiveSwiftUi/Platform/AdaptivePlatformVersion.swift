import Foundation

public enum AdaptiveOSGeneration: Int, CaseIterable, Sendable {
    case v15 = 15
    case v16 = 16
    case v17 = 17
    case v18 = 18
    case v26 = 26
}

public enum AdaptivePlatformVersion {
    public static var currentMajor: Int {
        ProcessInfo.processInfo.operatingSystemVersion.majorVersion
    }

    public static func isAtLeast(_ version: AdaptiveOSGeneration) -> Bool {
        currentMajor >= version.rawValue
    }

    public static var supportsWWDC25Design: Bool {
        #if os(iOS)
        if #available(iOS 26.0, *) { return true }
        return false
        #elseif os(macOS)
        if #available(macOS 26.0, *) { return true }
        return false
        #elseif os(tvOS)
        if #available(tvOS 26.0, *) { return true }
        return false
        #elseif os(watchOS)
        if #available(watchOS 26.0, *) { return true }
        return false
        #elseif os(visionOS)
        if #available(visionOS 26.0, *) { return true }
        return false
        #else
        return false
        #endif
    }

    public static var supportsTabContentAPI: Bool {
        #if os(iOS)
        if #available(iOS 18.0, *) { return true }
        return false
        #elseif os(macOS)
        if #available(macOS 15.0, *) { return true }
        return false
        #elseif os(tvOS)
        if #available(tvOS 18.0, *) { return true }
        return false
        #elseif os(watchOS)
        if #available(watchOS 11.0, *) { return true }
        return false
        #elseif os(visionOS)
        if #available(visionOS 2.0, *) { return true }
        return false
        #else
        return false
        #endif
    }

    public static var supportsAdaptableTabCustomization: Bool {
        #if os(iOS)
        if #available(iOS 18.0, *) { return true }
        return false
        #elseif os(macOS)
        if #available(macOS 15.0, *) { return true }
        return false
        #elseif os(visionOS)
        if #available(visionOS 2.0, *) { return true }
        return false
        #else
        return false
        #endif
    }

    public static var supportsAdvancedSheetPresentation: Bool {
        #if os(iOS)
        if #available(iOS 16.4, *) { return true }
        return false
        #elseif os(macOS)
        if #available(macOS 13.3, *) { return true }
        return false
        #elseif os(tvOS)
        if #available(tvOS 16.4, *) { return true }
        return false
        #elseif os(watchOS)
        if #available(watchOS 9.4, *) { return true }
        return false
        #elseif os(visionOS)
        if #available(visionOS 1.0, *) { return true }
        return false
        #else
        return false
        #endif
    }

    public static var supportsAdvancedListAPI: Bool {
        #if os(iOS)
        if #available(iOS 17.0, *) { return true }
        return false
        #elseif os(macOS)
        if #available(macOS 14.0, *) { return true }
        return false
        #elseif os(watchOS)
        if #available(watchOS 10.0, *) { return true }
        return false
        #elseif os(visionOS)
        if #available(visionOS 1.0, *) { return true }
        return false
        #else
        return false
        #endif
    }

    public static var supportsAdvancedPickerAPI: Bool {
        #if os(iOS)
        if #available(iOS 17.0, *) { return true }
        return false
        #elseif os(macOS)
        if #available(macOS 14.0, *) { return true }
        return false
        #elseif os(tvOS)
        if #available(tvOS 17.0, *) { return true }
        return false
        #elseif os(watchOS)
        if #available(watchOS 7.0, *) { return true }
        return false
        #elseif os(visionOS)
        if #available(visionOS 1.0, *) { return true }
        return false
        #else
        return false
        #endif
    }
}
