import ExploreSwiftUI
import SwiftUI

struct HomeHeaderView: View {
    let offsetY: CGFloat
    var onNotificationTap: () -> Void = {}

    init(offsetY: CGFloat, onNotificationTap: @escaping () -> Void = {}) {
        self.offsetY = offsetY
        self.onNotificationTap = onNotificationTap
    }
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("MONDAY, MAY 22")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .uniForegroundStyle(.secondary)

                Text("Today")
                    .font(.largeTitle)
                    .fontWeight(.bold)
            }

            Spacer()

            Image(systemName: "person.crop.circle.fill")  // Avatar placeholder
                .resizable()
                .frame(width: 40, height: 40)
                .foregroundColor(.gray)
                .background(Color(.systemGray6))
                .clipShape(Circle())
        }
        .padding(.horizontal)
    }
}
