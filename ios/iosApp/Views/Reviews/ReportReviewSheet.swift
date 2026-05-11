import SwiftUI

struct ReportReviewSheet: View {
    @Environment(\.presentationMode) var presentationMode
    @State private var selectedReason = "Spam"
    
    let reasons = ["Spam or advertising", "Offensive content", "Harassment or bullying", "Hate speech", "Other"]
    
    var body: some View {
        NavigationView {
            List {
                Section(header: Text("Why are you reporting this review?")) {
                    ForEach(reasons, id: \.self) { reason in
                        Button(action: {
                            selectedReason = reason
                        }) {
                            HStack {
                                Text(reason)
                                    .foregroundColor(.primary)
                                Spacer()
                                if selectedReason == reason {
                                    Image(systemName: "checkmark")
                                        .foregroundColor(.blue)
                                }
                            }
                        }
                    }
                }
                
                Section {
                    Button(action: {
                        // Submit logic
                        presentationMode.wrappedValue.dismiss()
                    }) {
                        Text("Submit Report")
                            .fontWeight(.medium)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 8)
                            .background(Color.blue)
                            .cornerRadius(8)
                    }
                    .listRowBackground(Color.clear)
                    .listRowInsets(EdgeInsets())
                }
            }
            .listStyle(InsetGroupedListStyle())
            .navigationTitle("Report Review")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
        }
    }
}

#Preview {
    ReportReviewSheet()
}
