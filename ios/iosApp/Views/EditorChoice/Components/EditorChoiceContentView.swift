import ExploreSwiftUI
import SwiftUI

struct EditorChoiceContentView: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 24) {

            // Introduction
            Text(
                "After immense global success, Crossfire: Legends has arrived to redefine mobile shooting."
            )
            .font(.title2)
            .fontWeight(.bold)
            .uniForegroundStyle(.primary)

            // Inline App CTA
            HStack {
                RoundedRectangle(cornerRadius: 12)
                    .frame(width: 48, height: 48)
                    .overlay(
                        Image(systemName: "flame.fill")
                            .foregroundColor(.orange)
                    )

                VStack(alignment: .leading) {
                    Text("Crossfire Legends")
                        .font(.headline)
                        .uniForegroundStyle(.primary)
                    Text("FPS Legend")
                        .font(.caption)
                        .uniForegroundStyle(.secondary)
                }

                Spacer()

                UniButton(action: {}) {
                    Text("NHẬN")
                        .font(.subheadline)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                        .padding(.horizontal, 20)
                        .padding(.vertical, 8)
                        .background(Color.blue)
                        .cornerRadius(20)
                }
            }
            .padding()
            .uniGlass(cornerRadius: 16)

            Text(
                "Join the elite ranks of the editorial team as we dive deep into the challenges awaiting you in this legendary arena. Whether you're a seasoned veteran or a newcomer to the genre, the tactical depth here is unmatched."
            )
            .font(.body)
            .lineSpacing(6)

            // Section 1
            VStack(alignment: .leading, spacing: 12) {
                Text("Unparalleled Mission Variety")
                    .font(.title3)
                    .fontWeight(.bold)

                Text(
                    "Crossfire: Legends isn't just a first-person shooter; it's a total combat experience with multiple modes. From classic team deathmatch to specialized tactical operations, every match feels like a fresh challenge."
                )
                .font(.body)
                .lineSpacing(6)
            }

            // Screenshot / Image
            RoundedRectangle(cornerRadius: 20)
                .fill(Color(.systemGray6))
                .frame(height: 220)
                .overlay(
                    Image(systemName: "gamecontroller.fill")
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 60)
                )

            // Section 2
            VStack(alignment: .leading, spacing: 12) {
                Text("Master Your Arsenal")
                    .font(.title3)
                    .fontWeight(.bold)

                Text(
                    "The game features a meticulously balanced collection of weaponry. Customize your loadout to match your playstyle—whether you prefer the stealthy approach of a suppressed carbine or the raw power of a heavy machine gun."
                )
                .font(.body)
                .lineSpacing(6)

                Text(
                    "As you progress, the stakes get higher and the rewards even greater. This is more than a game; it's a test of reflexes, strategy, and teamwork."
                )
                .font(.body)
                .lineSpacing(6)
            }

            Spacer(minLength: 80)  // Space for bottom bar
        }
        .padding(24)
    }
}
