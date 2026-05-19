import ExploreSwiftUI
import SwiftUI

struct EditProfileView: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var navigation: NavigationViewModel

    @State private var name: String = "John Doe"
    @State private var bio: String = "Digital enthusiast and app connoisseur."
    @State private var email: String = "john.doe@example.com"
    @State private var isLoading = false

    var body: some View {
        Form {
            Section {
                HStack {
                    Spacer()
                    VStack {
                        Image(systemName: "person.crop.circle.fill")
                            .resizable()
                            .frame(width: 100, height: 100)
                            .uniForegroundStyle(.secondary)
                            .background(Color(.systemGray6))
                            .clipShape(Circle())

                        UniButton("Change Photo") {
                            // Mock photo picker
                        }
                        .uniButtonStyle(.plain)
                        .font(.footnote)
                        .padding(.top, 4)
                    }
                    Spacer()
                }
                .listRowBackground(Color.clear)
            }

            Section(header: Text("Public Profile")) {
                TextField("Name", text: $name)

                VStack(alignment: .leading) {
                    Text("Bio")
                        .font(.caption)
                        .uniForegroundStyle(.secondary)
                    TextEditor(text: $bio)
                        .frame(minHeight: 80)
                }
            }

            Section(header: Text("Private Information")) {
                TextField("Email", text: $email)
                    .disabled(true)
                    .uniForegroundStyle(.secondary)
            }
        }
        .navigationTitle("Edit Profile")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                UniButton("Cancel") {
                    dismiss()
                }
                .uniButtonStyle(.plain)
            }

            ToolbarItem(placement: .confirmationAction) {
                UniButton("Done") {
                    saveProfile()
                }
                .uniButtonStyle(.plain)
                .disabled(isLoading || name.isEmpty)
            }
        }
    }

    private func saveProfile() {
        isLoading = true
        // Mock save delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            isLoading = false
            dismiss()
        }
    }
}
