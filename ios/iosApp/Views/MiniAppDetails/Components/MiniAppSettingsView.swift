import ExploreSwiftUI
import SwiftUI

struct MiniAppSettingsView: View {
    @Environment(\.presentationMode) var presentationMode

    // Mock State for Permissions
    @State private var locationAccess: Bool = true
    @State private var cameraAccess: Bool = true
    @State private var notificationsAccess: Bool = true
    @State private var contactsAccess: Bool = false

    var body: some View {
        NavigationView {

            UniScrollView {
                VStack(spacing: 24) {
                    // Header / App Info Summary
                    VStack(spacing: 8) {
                        Image(systemName: "cube.box.fill")  // Mock Icon
                            .font(.system(size: 48))
                            .uniForegroundStyle(.blue)
                            .padding()
                            .background(Color.white)
                            .cornerRadius(16)
                            .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)

                        Text("FreshBite Delivery")
                            .font(.title2)
                            .fontWeight(.bold)

                        Text("FreshBite Tech Solutions Inc.")
                            .font(.subheadline)
                            .uniForegroundStyle(.secondary)
                    }
                    .padding(.top, 24)

                    // PERMISSIONS
                    VStack(alignment: .leading, spacing: 8) {
                        Text("PERMISSIONS")
                            .font(.caption)
                            .fontWeight(.semibold)
                            .uniForegroundStyle(.secondary)
                            .padding(.horizontal)

                        VStack(spacing: 0) {
                            PermissionToggleRow(
                                icon: "location.fill",
                                iconColor: .blue,
                                title: "Location Access",
                                subtitle: "While using the app",
                                isOn: $locationAccess
                            )
                            UniDivider().padding(.leading, 56)

                            PermissionToggleRow(
                                icon: "camera.fill",
                                iconColor: .purple,
                                title: "Camera",
                                subtitle: "For scanning and profile",
                                isOn: $cameraAccess
                            )
                            UniDivider().padding(.leading, 56)

                            PermissionToggleRow(
                                icon: "bell.fill",
                                iconColor: .orange,
                                title: "Notifications",
                                subtitle: "Alerts and badges",
                                isOn: $notificationsAccess
                            )
                            UniDivider().padding(.leading, 56)

                            PermissionToggleRow(
                                icon: "person.crop.circle.fill",  // Contacts
                                iconColor: .green,
                                title: "Contacts",
                                subtitle: "Find friends to share with",
                                isOn: $contactsAccess
                            )
                        }
                        .uniGlass(cornerRadius: 16)
                    }
                    .padding(.horizontal)

                    // MINI APP INFO
                    VStack(alignment: .leading, spacing: 8) {
                        Text("MINI APP INFO")
                            .font(.caption)
                            .fontWeight(.semibold)
                            .uniForegroundStyle(.secondary)
                            .padding(.horizontal)

                        VStack(spacing: 0) {
                            InfoRowSettings(
                                label: "Developer", value: "FreshBite Tech", hasArrow: true)
                            UniDivider().padding(.leading, 16)
                            InfoRowSettings(label: "Version", value: "2.4.1 (890)")
                            UniDivider().padding(.leading, 16)
                            InfoRowSettings(label: "Last Updated", value: "Oct 12, 2023")
                        }
                        .uniGlass(cornerRadius: 16)
                    }
                    .padding(.horizontal)

                    // ACTIONS
                    VStack(spacing: 16) {
                        UniButton(action: {
                            // Reload action
                            presentationMode.wrappedValue.dismiss()
                        }) {
                            Text("Reload Application")
                                .fontWeight(.semibold)
                                .uniForegroundStyle(.blue)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.white)
                                .cornerRadius(16)
                        }
                        .uniButtonStyle(.plain)

                        UniButton(action: {
                            // Report action
                        }) {
                            Text("Report an Issue")
                                .fontWeight(.medium)
                                .uniForegroundStyle(.red)
                        }
                        .uniButtonStyle(.plain)
                    }
                    .padding(.horizontal)
                    .padding(.bottom, 32)
                }
            }

            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    UniButton("Done") {
                        presentationMode.wrappedValue.dismiss()
                    }
                    .uniButtonStyle(.plain)
                }
            }
        }
    }
}

// Components

struct PermissionToggleRow: View {
    let icon: String
    let iconColor: Color
    let title: String
    let subtitle: String
    @Binding var isOn: Bool

    var body: some View {
        HStack(spacing: 16) {
            ZStack {
                RoundedRectangle(cornerRadius: 8)
                    .fill(iconColor)
                    .frame(width: 32, height: 32)
                Image(systemName: icon)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.white)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.body)
                    .fontWeight(.medium)
                Text(subtitle)
                    .font(.caption)
                    .uniForegroundStyle(.secondary)
            }

            Spacer()

            Toggle("", isOn: $isOn)
                .labelsHidden()
        }
        .padding()
    }
}

struct InfoRowSettings: View {
    let label: String
    let value: String
    var hasArrow: Bool = false

    var body: some View {
        HStack {
            Text(label)
                .uniForegroundStyle(.primary)
            Spacer()
            Text(value)
                .uniForegroundStyle(.secondary)
            if hasArrow {
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .uniForegroundStyle(.secondary, opacity: 0.5)
            }
        }
        .padding()
        .font(.subheadline)
    }
}
