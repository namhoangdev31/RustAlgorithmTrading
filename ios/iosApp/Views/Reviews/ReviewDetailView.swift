import SwiftUI

struct ReviewDetailView: View {
    let reviewId: String
    
    // Mock Data
    @State private var helpfulCount = 12
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                // Header
                HStack(spacing: 12) {
                    Circle()
                        .fill(Color.gray.opacity(0.3))
                        .frame(width: 40, height: 40)
                    
                    VStack(alignment: .leading) {
                        Text("Jane Doe")
                            .font(.headline)
                        Text("Feb 24, 2024")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                    
                    HStack(spacing: 2) {
                        ForEach(0..<5) { index in
                            Image(systemName: index < 4 ? "star.fill" : "star")
                                .foregroundColor(.orange)
                                .font(.caption)
                        }
                    }
                }
                
                Text("Amazing App!")
                    .font(.title3)
                    .fontWeight(.bold)
                
                Text("This app has completely changed how I organize my daily tasks. The interface is clean and intuitive. Highly recommended for anyone looking for productivity boost.")
                    .font(.body)
                    .lineSpacing(4)
                
                Divider()
                
                // Developer Response
                VStack(alignment: .leading, spacing: 8) {
                    Text("Developer Response")
                        .font(.headline)
                    
                    Text("Feb 25, 2024")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Text("Thank you so much for your kind words! We work hard to make the app useful for everyone.")
                        .font(.body)
                        .padding()
                        .background(Color.gray.opacity(0.1))
                        .cornerRadius(8)
                }
                
                Divider()
                
                // Actions
                HStack {
                    Text("Was this review helpful?")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    
                    Spacer()
                    
                    Button(action: {
                        helpfulCount += 1
                    }) {
                        HStack(spacing: 4) {
                            Image(systemName: "hand.thumbsup")
                            Text("Helpful (\(helpfulCount))")
                        }
                        .font(.subheadline)
                        .foregroundColor(.blue)
                    }
                }
                
                Button(action: {
                    // Report action
                }) {
                    Text("Report Concern")
                        .font(.caption)
                        .foregroundColor(.red)
                }
                .padding(.top, 8)
            }
            .padding()
        }
        .navigationTitle("Review")
        .navigationBarTitleDisplayMode(.inline)
    }
}

#Preview {
    NavigationView {
        ReviewDetailView(reviewId: "1")
    }
}
