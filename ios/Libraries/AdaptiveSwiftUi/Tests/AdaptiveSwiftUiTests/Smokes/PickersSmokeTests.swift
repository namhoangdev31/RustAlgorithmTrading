import SwiftUI
import XCTest
@testable import AdaptiveSwiftUi

final class PickersSmokeTests: XCTestCase {
    @MainActor
    func testPickersContractsCompile() {
        _ = PickersSmokeView()
    }
}

private struct PickersSmokeView: View {
    @State private var selection = 1
    var body: some View {
        VStack {
            AdaptivePicker("Mode", selection: $selection) {
                Text("A").tag(1)
                Text("B").tag(2)
            }
            .adaptivePickerStyle(.menu)
            
            AdaptivePicker("Radio", selection: $selection) {
                Text("1").tag(1)
                Text("2").tag(2)
            }
            .adaptivePickerStyle(.radioGroup)
            .adaptiveHorizontalRadioGroupLayout()
            
            AdaptiveValueLabelPicker(selection: $selection) {
                Text("X").tag(1)
            } label: {
                Text("Picker")
            } currentValueLabel: {
                Text("Value: \(selection)")
            }
        }
        .adaptiveDefaultWheelPickerItemHeight(44)
    }
}
