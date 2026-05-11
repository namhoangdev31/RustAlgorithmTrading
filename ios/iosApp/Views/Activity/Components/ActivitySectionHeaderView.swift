import SwiftUI

struct ActivitySectionHeaderView: View {
    let title: String
    
    var body: some View {
        Text(title)
            .font(.title3)
            .fontWeight(.bold)
            .padding(.horizontal)
            .padding(.top, 16)
            .padding(.bottom, 8)
    }
}
