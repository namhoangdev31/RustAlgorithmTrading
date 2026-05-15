import SwiftUI

/// Defines the five standard levels of material thickness.
public enum AdaptiveMaterialType: Sendable {
    case ultraThin
    case thin
    case regular
    case thick
    case ultraThick
}

/// A component that acts as a translucent material background.
/// On iOS 15+, it uses the native SwiftUI ShapeStyle `.regularMaterial` etc.
/// On iOS 13/14, it uses `UIViewRepresentable` to bridge `UIVisualEffectView`.
public struct AdaptiveMaterial: View {
    private let type: AdaptiveMaterialType
    
    public init(_ type: AdaptiveMaterialType = .regular) {
        self.type = type
    }
    
    public var body: some View {
        #if os(iOS) || os(macOS) || os(tvOS) || os(visionOS) || os(watchOS)
        if #available(iOS 15.0, macOS 12.0, tvOS 15.0, watchOS 8.0, visionOS 1.0, *) {
            switch type {
            case .ultraThin: Rectangle().fill(.ultraThinMaterial)
            case .thin: Rectangle().fill(.thinMaterial)
            case .regular: Rectangle().fill(.regularMaterial)
            case .thick: Rectangle().fill(.thickMaterial)
            case .ultraThick: Rectangle().fill(.ultraThickMaterial)
            }
        } else {
            #if canImport(UIKit) && !os(watchOS)
            BlurView(style: blurStyle(for: type))
            #elseif canImport(AppKit)
            MacBlurView(type: type)
            #else
            // Fallback for watchOS < 8
            fallbackColor
            #endif
        }
        #else
        fallbackColor
        #endif
    }
    
    private var fallbackColor: some View {
        switch type {
        case .ultraThin: return Color.gray.opacity(0.2)
        case .thin: return Color.gray.opacity(0.4)
        case .regular: return Color.gray.opacity(0.6)
        case .thick: return Color.gray.opacity(0.8)
        case .ultraThick: return Color.gray.opacity(0.9)
        }
    }

    #if canImport(UIKit) && !os(watchOS)
    private func blurStyle(for type: AdaptiveMaterialType) -> UIBlurEffect.Style {
        // Map to iOS 13+ standard system materials
        switch type {
        case .ultraThin: return .systemUltraThinMaterial
        case .thin: return .systemThinMaterial
        case .regular: return .systemMaterial
        case .thick: return .systemThickMaterial
        case .ultraThick: return .systemChromeMaterial
        }
    }
    #endif
}

#if canImport(UIKit) && !os(watchOS)
private struct BlurView: UIViewRepresentable {
    let style: UIBlurEffect.Style
    
    func makeUIView(context: Context) -> UIVisualEffectView {
        let view = UIVisualEffectView(effect: UIBlurEffect(style: style))
        return view
    }
    
    func updateUIView(_ uiView: UIVisualEffectView, context: Context) {
        uiView.effect = UIBlurEffect(style: style)
    }
}
#endif

#if canImport(AppKit) && !targetEnvironment(macCatalyst)
import AppKit
private struct MacBlurView: NSViewRepresentable {
    let type: AdaptiveMaterialType
    
    func makeNSView(context: Context) -> NSVisualEffectView {
        let view = NSVisualEffectView()
        view.blendingMode = .behindWindow
        view.state = .active
        view.material = macMaterial(for: type)
        return view
    }
    
    func updateNSView(_ nsView: NSVisualEffectView, context: Context) {
        nsView.material = macMaterial(for: type)
    }
    
    private func macMaterial(for type: AdaptiveMaterialType) -> NSVisualEffectView.Material {
        // Approximate mappings for NSVisualEffectView.Material
        switch type {
        case .ultraThin: return .windowBackground
        case .thin: return .menu
        case .regular: return .popover
        case .thick: return .hudWindow
        case .ultraThick: return .headerView
        }
    }
}
#endif
