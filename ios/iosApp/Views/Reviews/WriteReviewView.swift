import SwiftUI

struct WriteReviewView: View {
    let appId: String
    @Environment(\.dismiss) var dismiss
    
    @State private var rating: Int = 0
    @State private var title: String = ""
    @State private var review: String = ""
    @State private var nickname: String = "AppExplorer"
    @State private var isSubmitting: Bool = false
    
    var body: some View {
        NavigationView {
            Form {
                Section {
                    HStack {
                        Spacer()
                        VStack(spacing: 8) {
                            Text("Tap to Rate:")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            
                            HStack(spacing: 12) {
                                ForEach(1...5, id: \.self) { star in
                                    Image(systemName: star <= rating ? "star.fill" : "star")
                                        .font(.title)
                                        .foregroundColor(.orange)
                                        .onTapGesture {
                                            withAnimation(.spring()) {
                                                rating = star
                                            }
                                        }
                                }
                            }
                        }
                        Spacer()
                    }
                    .padding(.vertical)
                    .listRowBackground(Color.clear)
                }
                
                Section(header: Text("Review Details")) {
                    TextField("Title", text: $title)
                    
                    ZStack(alignment: .topLeading) {
                        if review.isEmpty {
                            Text("Review (Optional)")
                                .foregroundColor(Color(UIColor.placeholderText))
                                .padding(.top, 8)
                                .padding(.leading, 5)
                        }
                        TextEditor(text: $review)
                            .frame(minHeight: 120)
                    }
                }
                
                Section(header: Text("Reviewer Info")) {
                     TextField("Nickname", text: $nickname)
                }
            }
            .navigationTitle("Write a Review")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .confirmationAction) {
                    if isSubmitting {
                        ProgressView()
                    } else {
                        Button("Submit") {
                            submitReview()
                        }
                         
                        .disabled(rating == 0 || title.isEmpty)
                    }
                }
            }
        }
    }
    
    private func submitReview() {
        isSubmitting = true
        // Mock API Call
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            isSubmitting = false
            dismiss()
        }
    }
}
