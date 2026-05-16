import AdaptiveSwiftUi
import SwiftUI

struct ReportReviewSheet: View {
    @Environment(\.presentationMode) var presentationMode
    @State private var selectedReason = "Spam"

    let reasons = [
        "Spam or advertising", "Offensive content", "Harassment or bullying", "Hate speech",
        "Other",
    ]

    var body: some View {
        NavigationView {
            AdaptiveList {
                Section(header: Text("Why are you reporting this review?")) {
                    ForEach(reasons, id: \.self) { reason in
                        Button(action: {
                            selectedReason = reason
                        }) {
                            HStack {
                                Text(reason)
                                    .adaptiveForegroundStyle(.primary)
                                Spacer()
                                if selectedReason == reason {
                                    Image(systemName: "checkmark")
                                        .adaptiveForegroundStyle(.blue)
                                }
                            }
                        }
                    }
                }

                Section {
                    AdaptiveButton(action: {
                        // Submit logic
                        presentationMode.wrappedValue.dismiss()
                    }) {
                        Text("Submit Report")
                            .fontWeight(.medium)
                            .adaptiveForegroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 8)
                            .background(Color.blue)
                            .cornerRadius(8)
                    }
                    .adaptiveButtonStyle(.plain)
                    .listRowBackground(Color.clear)
                    .listRowInsets(EdgeInsets())
                }
            }
            .listStyle(InsetGroupedListStyle())
            .navigationTitle("Report Review")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    AdaptiveButton("Cancel") {
                        presentationMode.wrappedValue.dismiss()
                    }
                    .adaptiveButtonStyle(.plain)
                }
            }
        }
    }
}

#Preview {
    ReportReviewSheet()
}
