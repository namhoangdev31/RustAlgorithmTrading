import SwiftUI
import XCTest
@testable import AdaptiveSwiftUi

final class DatePickersSmokeTests: XCTestCase {
    @MainActor
    func testDatePickersContractsCompile() {
        _ = DatePickersSmokeView()
    }
}

private struct DatePickersSmokeView: View {
    @State private var date = Date()
    @State private var dates = Set<DateComponents>()
    var body: some View {
        VStack {
            AdaptiveDatePicker("Pick", selection: $date)
                .adaptiveDatePickerStyle(.graphical)
            
            AdaptiveDatePicker("Range", selection: $date, in: Date()...)
                .adaptiveDatePickerStyle(.wheel)
            
            AdaptiveMultiDatePicker(selection: $dates) {
                Text("Multi")
            }
        }
    }
}
