import SwiftUI


/// A generic adaptive text component that polyfills modern iOS 15/18+ FormatStyle APIs
/// by automatically falling back to classic Foundation formatters on older OS versions.
public struct AdaptiveText: View {
    private let content: AnyView

    public var body: some View {
        content
    }

    // MARK: - Basic String
    
    public init(_ text: String) {
        self.content = AnyView(Text(text))
    }
    
    // MARK: - Number / Currency / Percent
    
    public init<T: BinaryFloatingPoint>(_ value: T, format: AdaptiveNumberFormat) {
        let doubleValue = Double(value)
        #if os(iOS) || os(macOS) || os(watchOS) || os(tvOS) || os(visionOS)
        if #available(iOS 15.0, macOS 12.0, tvOS 15.0, watchOS 8.0, *) {
            switch format {
            case .currency(let code):
                self.content = AnyView(Text(doubleValue, format: .currency(code: code)))
            case .percent:
                self.content = AnyView(Text(doubleValue, format: .percent))
            case .decimal(let fractionLength, let grouping, let scientific):
                var style: FloatingPointFormatStyle<Double> = .number
                if let f = fractionLength {
                    style = style.precision(.fractionLength(f))
                }
                if grouping {
                    style = style.grouping(.automatic)
                }
                if scientific {
                    style = style.notation(.scientific)
                }
                self.content = AnyView(Text(doubleValue, format: style))
            }
        } else {
            self.content = AnyView(Text(Self.formatNumber(doubleValue, format: format)))
        }
        #else
        self.content = AnyView(Text(Self.formatNumber(doubleValue, format: format)))
        #endif
    }
    
    public init<T: BinaryInteger>(_ value: T, format: AdaptiveNumberFormat) {
        self.init(Double(value), format: format)
    }

    // MARK: - Measurement
    
    public init<UnitType: Dimension>(_ measurement: Measurement<UnitType>, width: AdaptiveMeasurementWidth) {
        #if os(iOS) || os(macOS) || os(watchOS) || os(tvOS) || os(visionOS)
        if #available(iOS 15.0, macOS 12.0, tvOS 15.0, watchOS 8.0, *) {
            let nativeWidth: Measurement<UnitType>.FormatStyle.UnitWidth
            switch width {
            case .wide: nativeWidth = .wide
            case .narrow: nativeWidth = .narrow
            case .abbreviated: nativeWidth = .abbreviated
            }
            self.content = AnyView(Text(measurement, format: .measurement(width: nativeWidth)))
        } else {
            self.content = AnyView(Text(Self.formatMeasurement(measurement, width: width)))
        }
        #else
        self.content = AnyView(Text(Self.formatMeasurement(measurement, width: width)))
        #endif
    }

    // MARK: - Date / Time
    
    public init(date: Date, showTime: Bool = false, showDate: Bool = true) {
        #if os(iOS) || os(macOS) || os(watchOS) || os(tvOS) || os(visionOS)
        if #available(iOS 15.0, macOS 12.0, tvOS 15.0, watchOS 8.0, *) {
            var style = Date.FormatStyle.dateTime
            if showTime { style = style.hour().minute().second() }
            if showDate { style = style.day().month().year() }
            self.content = AnyView(Text(date, format: style))
        } else {
            self.content = AnyView(Text(Self.formatDate(date, showTime: showTime, showDate: showDate)))
        }
        #else
        self.content = AnyView(Text(Self.formatDate(date, showTime: showTime, showDate: showDate)))
        #endif
    }

    // MARK: - Duration
    
    public init(seconds: TimeInterval, pattern: AdaptiveTimePattern) {
        #if os(iOS) || os(macOS) || os(watchOS) || os(tvOS) || os(visionOS)
        if #available(iOS 16.0, macOS 13.0, tvOS 16.0, watchOS 9.0, *) {
            let nativePattern: Duration.TimeFormatStyle.Pattern
            switch pattern {
            case .hourMinute: nativePattern = .hourMinute
            case .minuteSecond: nativePattern = .minuteSecond
            }
            self.content = AnyView(Text(Duration.seconds(seconds), format: .time(pattern: nativePattern)))
        } else {
            self.content = AnyView(Text(Self.formatDuration(seconds: seconds, pattern: pattern)))
        }
        #else
        self.content = AnyView(Text(Self.formatDuration(seconds: seconds, pattern: pattern)))
        #endif
    }

    // MARK: - Fallback Formatters

    private static func formatNumber(_ value: Double, format: AdaptiveNumberFormat) -> String {
        let formatter = NumberFormatter()
        switch format {
        case .currency(let code):
            formatter.numberStyle = .currency
            formatter.currencyCode = code
        case .percent:
            formatter.numberStyle = .percent
        case .decimal(let fractionLength, let grouping, let scientific):
            formatter.numberStyle = scientific ? .scientific : .decimal
            formatter.usesGroupingSeparator = grouping
            if let f = fractionLength {
                formatter.minimumFractionDigits = f
                formatter.maximumFractionDigits = f
            }
        }
        return formatter.string(from: NSNumber(value: value)) ?? "\(value)"
    }

    private static func formatMeasurement<UnitType: Dimension>(_ measurement: Measurement<UnitType>, width: AdaptiveMeasurementWidth) -> String {
        let formatter = MeasurementFormatter()
        switch width {
        case .wide: formatter.unitStyle = .long
        case .narrow: formatter.unitStyle = .short
        case .abbreviated: formatter.unitStyle = .medium
        }
        return formatter.string(from: measurement)
    }

    private static func formatDate(_ date: Date, showTime: Bool, showDate: Bool) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = showDate ? .medium : .none
        formatter.timeStyle = showTime ? .medium : .none
        return formatter.string(from: date)
    }

    private static func formatDuration(seconds: TimeInterval, pattern: AdaptiveTimePattern) -> String {
        let formatter = DateComponentsFormatter()
        formatter.unitsStyle = .positional
        formatter.zeroFormattingBehavior = .pad
        switch pattern {
        case .hourMinute:
            formatter.allowedUnits = [.hour, .minute]
        case .minuteSecond:
            formatter.allowedUnits = [.minute, .second]
        }
        return formatter.string(from: seconds) ?? "\(seconds)"
    }
}
