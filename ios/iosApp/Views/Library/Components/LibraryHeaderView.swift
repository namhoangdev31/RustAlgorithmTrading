import SwiftUI

struct LibraryHeaderView: View {
    let offsetY: CGFloat
    var onMenuTap: () -> Void
    @EnvironmentObject var navigation: NavigationViewModel

    init(offsetY: CGFloat = 0, onMenuTap: @escaping () -> Void = {}) {
        self.offsetY = offsetY
        self.onMenuTap = onMenuTap
    }



    var body: some View {
        HStack {
            Button(action: {
                onMenuTap()
            }) {
                Image(systemName: "slider.horizontal.3")
                    .font(.system(size: 20))
                    .symbolRenderingMode(.multicolor)
            }
            // VStack(alignment: .leading, spacing: 4) {
            //     Image(systemName: "line.horizontal.3.decrease.circle.fill")
            //         .font(.system(size: 20))
            //     Text("32 Apps Installed")
            //         .font(.leposBodySmall)
            //         .foregroundColor(.gray)
            // }
            .offset(x: offsetY > -45 ? -(offsetY + 45) : 0)
            .animation(.interactiveSpring, value: offsetY)

            Spacer()

            HStack(spacing: 16) {
                Button(action: {
                    navigation.navigate(to: .activity)
                }) {
                    Image(systemName: "bell.badge.fill")
                        .font(.system(size: 20))
                        .symbolRenderingMode(.multicolor)
                }
            }
            .offset(x: offsetY > -45 ? (offsetY + 45) : 0)
            .animation(.interactiveSpring, value: offsetY)
        }
        .padding(.horizontal)
    }
}
