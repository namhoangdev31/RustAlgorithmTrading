import SwiftUI
import XCTest
@testable import AdaptiveSwiftUi

final class GaugesSmokeTests: XCTestCase {
    @MainActor
    func testGaugesContractsCompile() {
        _ = GaugesSmokeView()
    }
}

private struct GaugesSmokeView: View {
    var body: some View {
        VStack {
            AdaptiveGauge(value: 0.75) {
                Text("Linear")
            }
            .adaptiveGaugeStyle(.accessoryLinear)
            .adaptiveGaugeTint(.blue)
            
            AdaptiveGauge(value: 0.5, in: 0...1) {
                Text("Circular")
            } currentValueLabel: {
                Text("50%")
            } minimumValueLabel: {
                Text("0")
            } maximumValueLabel: {
                Text("100")
            }
            .adaptiveGaugeStyle(.accessoryCircularCapacity)
        }
    }
}
