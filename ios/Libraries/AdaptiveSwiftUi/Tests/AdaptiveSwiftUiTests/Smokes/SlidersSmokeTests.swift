import SwiftUI
import XCTest
@testable import AdaptiveSwiftUi

final class SlidersSmokeTests: XCTestCase {
    @MainActor
    func testSlidersContractsCompile() {
        _ = SlidersSmokeView()
    }
}

private struct SlidersSmokeView: View {
    @State private var value = 0.5
    var body: some View {
        VStack {
            AdaptiveTickedSlider(
                value: $value,
                in: 0...1,
                step: 0.1,
                tickValues: [0, 0.5, 1]
            ) {
                Text("Label")
            } currentValueLabel: {
                Text("\(value)")
            } minimumValueLabel: {
                Text("Min")
            } maximumValueLabel: {
                Text("Max")
            }
            .adaptiveSliderTint(.blue)
            
            AdaptiveTickedSlider(value: $value, tickValues: [0.25, 0.75]) {
                Text("Ticks")
            } currentValueLabel: { EmptyView() }
            minimumValueLabel: { EmptyView() }
            maximumValueLabel: { EmptyView() }
            tickLabel: { tick in
                Text("\(tick)")
            }
        }
    }
}
