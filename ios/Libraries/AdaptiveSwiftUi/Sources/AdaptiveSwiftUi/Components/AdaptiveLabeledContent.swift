import SwiftUI

/// An adaptive component that mimics `LabeledContent`.
/// - On newer OS versions (e.g. iOS 16+), it uses the native `LabeledContent`.
/// - On older OS versions, it falls back to an `HStack` with a `Spacer`.
public struct AdaptiveLabeledContent<Label: View, Content: View>: View {
    private enum NativeType {
        case custom
        case stringKey(LocalizedStringKey, String)
        case string(String, String)
    }

    private let nativeType: NativeType
    private let label: Label
    private let content: Content

    public init(@ViewBuilder content: () -> Content, @ViewBuilder label: () -> Label) {
        self.label = label()
        self.content = content()
        self.nativeType = .custom
    }

    private init(nativeType: NativeType, label: Label, content: Content) {
        self.nativeType = nativeType
        self.label = label
        self.content = content
    }

    public var body: some View {
        switch nativeType {
        case .custom:
            if #available(iOS 16.0, macOS 13.0, tvOS 16.0, watchOS 9.0, visionOS 1.0, *) {
                LabeledContent {
                    content
                } label: {
                    label
                }
            } else {
                fallback
            }
        case .stringKey(let tk, let v):
            if #available(iOS 16.0, macOS 13.0, tvOS 13.0, watchOS 9.0, visionOS 1.0, *) {
                LabeledContent(tk, value: v)
            } else {
                fallback
            }
        case .string(let ts, let v):
            if #available(iOS 16.0, macOS 13.0, tvOS 13.0, watchOS 9.0, visionOS 1.0, *) {
                LabeledContent(ts, value: v)
            } else {
                fallback
            }
        }
    }

    @ViewBuilder
    private var fallback: some View {
        HStack {
            label
            Spacer()
            content.foregroundColor(.secondary)
        }
    }
}

extension AdaptiveLabeledContent where Label == Text, Content == Text {

    // MARK: - String-based Initializers

    public init<S: StringProtocol>(_ title: S, value: S) {
        self.init(
            nativeType: .string(String(title), String(value)),
            label: Text(title),
            content: Text(value)
        )
    }

    public init(_ titleKey: LocalizedStringKey, value: String) {
        self.init(
            nativeType: .stringKey(titleKey, value),
            label: Text(titleKey),
            content: Text(value)
        )
    }

    // MARK: - Formatted Initializers

    @available(iOS 15.0, macOS 12.0, tvOS 15.0, watchOS 8.0, *)
    public init<S: StringProtocol, F: FormatStyle>(_ title: S, value: F.FormatInput, format: F)
    where F.FormatOutput == String {
        let formatted = format.format(value)
        self.init(
            nativeType: .string(String(title), formatted),
            label: Text(title),
            content: Text(formatted)
        )
    }

    @available(iOS 15.0, macOS 12.0, tvOS 15.0, watchOS 8.0, *)
    public init<F: FormatStyle>(_ titleKey: LocalizedStringKey, value: F.FormatInput, format: F)
    where F.FormatOutput == String {
        let formatted = format.format(value)
        self.init(
            nativeType: .stringKey(titleKey, formatted),
            label: Text(titleKey),
            content: Text(formatted)
        )
    }
}
