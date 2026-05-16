import SwiftUI
import AdaptiveSwiftUi


struct SearchHeaderView: View {
    var body: some View {
        HStack {
            Text("Search")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            Spacer()
            
            Image(systemName: "person.crop.circle.fill")
                .font(.largeTitle)
                .adaptiveForegroundStyle(.secondary)
        }
        .padding(.horizontal)
        .padding(.top)
    }
}
