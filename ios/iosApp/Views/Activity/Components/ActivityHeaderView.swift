import ExploreSwiftUI
import SwiftUI

struct ActivityHeaderView: View {
    var body: some View {
        HStack(alignment: .bottom) {
            VStack(alignment: .leading, spacing: 4) {
                Text("THURSDAY, OCT 24")
                    .font(.caption)
                    .uniSemi()
                    .uniForegroundStyle(.gray)

                Text("Activity")
                    .font(.largeTitle)
                    .uniBold()
            }

            Spacer()

            // Read All Button
            UniButton(action: {
                // Action to mark all as read
            }) {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 28))
                    .uniForegroundStyle(Color.leposSurfaceContainerHighest)
                    .overlay(
                        Image(systemName: "checkmark")
                            .font(.system(size: 10, weight: .bold))
                            .uniForegroundStyle(.blue)
                    )
            }

            // Profile Icon (optional, if needed to match Home, but requirements didn't explicitly ask for it here, keeping it clean based on "Read All" request)
            Image(systemName: "person.crop.circle.fill")  // Placeholder
                .resizable()
                .frame(width: 30, height: 30)
                .uniForegroundStyle(.orange.opacity(0.8))
                .background(Color.leposSurfaceContainerHigh)
                .clipShape(Circle())
        }
        .padding(.horizontal)
        .padding(.bottom, 8)
    }
}
