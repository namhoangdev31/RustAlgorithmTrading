import SwiftUI
import XCTest

@testable import AdaptiveSwiftUi

final class ProgressViewsSmokeTests: XCTestCase {
    @MainActor
    func testProgressViewsContractsCompile() {
        _ = ProgressViewsSmokeView()
    }
}

private struct ProgressViewsSmokeView: View {
    var body: some View {
        ScrollView {
            VStack(spacing: 30) {
                Section("Indeterminate") {
                    AdaptiveProgressView("Loading...")
                        .adaptiveProgressViewStyle(.circular)

                    AdaptiveProgressView {
                        Text("Custom Indeterminate")
                    }
                    .adaptiveProgressViewStyle(.linear)
                }

                Section("Value-based") {
                    AdaptiveProgressView("Downloading", value: 0.6)
                        .adaptiveProgressViewStyle(.linear)
                        .adaptiveProgressTint(.blue)

                    AdaptiveProgressView(value: 0.3) {
                        Text("Circular Progress")
                    }
                    .adaptiveProgressViewStyle(.circular)
                    .adaptiveProgressTint(.orange)
                }

                Section("Timer-based") {
                    if #available(iOS 14.0, macOS 11.0, watchOS 7.0, tvOS 14.0, *) {
                        AdaptiveProgressView(
                            timerInterval: DateInterval(
                                start: Date(), end: Date().addingTimeInterval(30)),
                            countsDown: true
                        ) {
                            Text("Countdown")
                        } currentValueLabel: {
                            Text("Time remaining")
                        }
                    }
                }
            }
            .padding()
        }
    }
}
