import ExploreSwiftUI
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
            UniList {
                Section(header: Text("Why are you reporting this review?")) {
                    ForEach(reasons, id: \.self) { reason in
                        Button(action: {
                            selectedReason = reason
                        }) {
                            HStack {
                                Text(reason)
                                    .uniForegroundStyle(.primary)
                                Spacer()
                                if selectedReason == reason {
                                    Image(systemName: "checkmark")
                                        .uniForegroundStyle(.blue)
                                }
                            }
                        }
                    }
                }

                Section {
                    UniButton(action: {
                        // Submit logic
                        presentationMode.wrappedValue.dismiss()
                    }) {
                        Text("Submit Report")
                            .fontWeight(.medium)
                            .uniForegroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 8)
                            .background(Color.blue)
                            .cornerRadius(8)
                    }
                    .uniButtonStyle(.plain)
                    .listRowBackground(Color.clear)
                    .listRowInsets(EdgeInsets())
                }
            }
            .listStyle(InsetGroupedListStyle())
            .navigationTitle("Report Review")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    UniButton("Cancel") {
                        presentationMode.wrappedValue.dismiss()
                    }
                    .uniButtonStyle(.plain)
                }
            }
        }
    }
}

#Preview {
    ReportReviewSheet()
}
