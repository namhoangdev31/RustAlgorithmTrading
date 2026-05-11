import SwiftUI

struct FallbackViewOld: View {
    let title: String
    @Environment(\.presentationMode) var presentationMode
    
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 60))
                .foregroundColor(.orange)
            
            Text("\(title) is not yet optimized for iOS 16/17/18.")
                .font(.headline)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
            
            Button("Go Back") {
                presentationMode.wrappedValue.dismiss()
            }
            .padding()
            .background(Color.blue)
            .foregroundColor(.white)
            .cornerRadius(12)
        }
        .navigationTitle(title)
    }
}
