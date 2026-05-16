import SwiftUI
import AdaptiveSwiftUi


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
                AdaptiveButton(action: onSettingsTap) {
                    Image(systemName: "gearshape.fill")
                        .font(.title2)
                        .adaptiveForegroundStyle(.primary)
                        .padding(8)
                        .background(Color(.systemGray6))
                        .clipShape(Circle())
                }
                .adaptiveButtonStyle(.plain)
            }
            .offset(x: offsetY > -45 ? (offsetY + 45) : 0)
            .animation(.interactiveSpring, value: offsetY)
        }
        .padding(.horizontal)
    }
}
