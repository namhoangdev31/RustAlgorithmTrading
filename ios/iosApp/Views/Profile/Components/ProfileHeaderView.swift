import SwiftUI

struct ProfileHeaderView: View {
    let offsetY: CGFloat
    var onSettingsTap: () -> Void = {}

    init(offsetY: CGFloat = 0, onSettingsTap: @escaping () -> Void = {}) {
        self.offsetY = offsetY
        self.onSettingsTap = onSettingsTap
    }

    var body: some View {
        HStack {
            Spacer()
            
            HStack(spacing: 16) {
                Button(action: onSettingsTap) {
                    Image(systemName: "gearshape.fill")
                        .font(.title2)
                        .foregroundColor(.primary)
                        .padding(8)
                        .background(Color(.systemGray6))
                        .clipShape(Circle())
                }
            }
            .offset(x: offsetY > -45 ? (offsetY + 45) : 0)
            .animation(.interactiveSpring, value: offsetY)
        }
        .padding(.horizontal)
    }
}
