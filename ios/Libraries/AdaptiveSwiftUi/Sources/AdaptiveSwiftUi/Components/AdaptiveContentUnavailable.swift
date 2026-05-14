import SwiftUI
import Foundation

public struct AdaptiveContentUnavailable<Label: View, Description: View, Actions: View>: View {
    private let label: () -> Label
    private let description: () -> Description
    private let actions: () -> Actions

    public init(
        @ViewBuilder label: @escaping () -> Label,
        @ViewBuilder description: @escaping () -> Description,
        @ViewBuilder actions: @escaping () -> Actions
    ) {
        self.label = label
        self.description = description
        self.actions = actions
    }

    @ViewBuilder
    public var body: some View {
        if #available(iOS 17.0, macOS 14.0, tvOS 17.0, watchOS 10.0, visionOS 1.0, *) {
            ContentUnavailableView {
                label()
            } description: {
                description()
            } actions: {
                actions()
            }
        } else {
            VStack(spacing: 12) {
                label()
                    .font(.headline)
                description()
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                actions()
            }
            .multilineTextAlignment(.center)
            .padding(24)
        }
    }
}

public extension AdaptiveContentUnavailable where Label == SwiftUI.Label<Text, Image>, Description == Text, Actions == EmptyView {
    init(
        _ title: LocalizedStringKey,
        systemImage: String,
        description: LocalizedStringKey
    ) {
        self.init {
            SwiftUI.Label(title, systemImage: systemImage)
        } description: {
            Text(description)
        } actions: {
            EmptyView()
        }
    }
}

public struct AdaptiveSearchUnavailable: View {
    private let text: String?

    public init(text: String? = nil) {
        self.text = text
    }

    @ViewBuilder
    public var body: some View {
        if #available(iOS 17.0, macOS 14.0, tvOS 17.0, watchOS 10.0, visionOS 1.0, *) {
            if let text, !text.isEmpty {
                ContentUnavailableView.search(text: text)
            } else {
                ContentUnavailableView.search
            }
        } else {
            VStack(spacing: 10) {
                Image(systemName: "magnifyingglass")
                    .font(.title2)
                Text("No Results")
                    .font(.headline)
                if let text, !text.isEmpty {
                    Text("No results for \(text)")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }
            .multilineTextAlignment(.center)
            .padding(24)
        }
    }
}

public struct AdaptiveLabeledContent<Label: View, ValueContent: View>: View {
    private let label: () -> Label
    private let valueContent: () -> ValueContent

    public init(
        @ViewBuilder label: @escaping () -> Label,
        @ViewBuilder valueContent: @escaping () -> ValueContent
    ) {
        self.label = label
        self.valueContent = valueContent
    }

    @ViewBuilder
    public var body: some View {
        if #available(iOS 16.0, macOS 13.0, tvOS 16.0, watchOS 9.0, visionOS 1.0, *) {
            LabeledContent {
                valueContent()
            } label: {
                label()
            }
        } else {
            HStack {
                label()
                Spacer(minLength: 8)
                valueContent()
            }
        }
    }
}

public struct AdaptiveShareLink<Label: View>: View {
    private let url: URL
    private let label: () -> Label
    private let subject: Text?
    private let message: Text?

    public init(
        item url: URL,
        subject: Text? = nil,
        message: Text? = nil,
        @ViewBuilder label: @escaping () -> Label
    ) {
        self.url = url
        self.subject = subject
        self.message = message
        self.label = label
    }

    @ViewBuilder
    public var body: some View {
        #if !os(tvOS)
        if #available(iOS 16.0, macOS 13.0, watchOS 9.0, visionOS 1.0, *) {
            if let subject, let message {
                ShareLink(item: url, subject: subject, message: message) {
                    label()
                }
            } else {
                ShareLink(item: url) {
                    label()
                }
            }
        } else {
            Link(destination: url) {
                label()
            }
        }
        #else
        Link(destination: url) {
            label()
        }
        #endif
    }
}

public struct AdaptiveFormattedText<Value, Format>: View
where Value: Equatable, Format: FormatStyle, Format.FormatInput == Value, Format.FormatOutput == String {
    private let value: Value
    private let format: Format

    public init(_ value: Value, format: Format) {
        self.value = value
        self.format = format
    }

    @ViewBuilder
    public var body: some View {
        if #available(iOS 18.0, macOS 15.0, watchOS 11.0, tvOS 18.0, visionOS 2.0, *) {
            Text(value, format: format)
        } else {
            Text(String(describing: value))
        }
    }
}
