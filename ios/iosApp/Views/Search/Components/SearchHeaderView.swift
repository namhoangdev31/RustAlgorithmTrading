import SwiftUI

struct SearchHeaderView: View {
    var body: some View {
        HStack {
            Text("Search")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            Spacer()
            
            Image(systemName: "person.crop.circle.fill")
                .font(.largeTitle)
                .foregroundColor(.gray)
        }
        .padding(.horizontal)
        .padding(.top)
    }
}
