import SwiftUI

struct DiscoveryHeaderView: View {
    let offsetY: CGFloat

    init(offsetY: CGFloat = 0) {
        self.offsetY = offsetY
    }

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("WEDNESDAY, MAY 22")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.gray)
                
                Text("Discover")
                    .font(.largeTitle)
                    .fontWeight(.bold)
            }
            .offset(x: offsetY > -45 ? -(offsetY + 45) : 0)
            .animation(.interactiveSpring, value: offsetY)
            
            Spacer()
            Button(action:{}){
                Image(systemName: "ellipses.bubble") // AI Chat Icon Placeholder
                    .font(.system(size: 22)) // Size it appropriately
                    .foregroundColor(.leposPrimary)
            }
                .offset(x: offsetY > -45 ? (offsetY + 45) : 0)
                .animation(.interactiveSpring, value: offsetY)
        }
        .padding(.horizontal)
    }
}
