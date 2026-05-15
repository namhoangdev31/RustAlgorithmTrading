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
        ScrollView {
            VStack(spacing: 20) {
                AdaptiveGauge(value: 0.75) {
                    Text("Accessory Linear")
                }
                .adaptiveGaugeStyle(.accessoryLinear)
                .adaptiveGaugeTint(.blue)
                
                AdaptiveGauge(value: 0.5, in: 0...1) {
                    Text("Accessory Circular")
                } currentValueLabel: {
                    Text("50%")
                } minimumValueLabel: {
                    Text("0")
                } maximumValueLabel: {
                    Text("100")
                }
                .adaptiveGaugeStyle(.accessoryCircularCapacity)
                
                AdaptiveGauge(value: 0.3) {
                    Text("Automatic")
                }
                .adaptiveGaugeStyle(.automatic)
                
                AdaptiveGauge(value: 0.6) {
                    Text("Linear")
                }
                .adaptiveGaugeStyle(.linear)
                
                AdaptiveGauge(value: 0.4) {
                    Text("Circular")
                }
                .adaptiveGaugeStyle(.circular)
            }
            .padding()
        }
    }
}
