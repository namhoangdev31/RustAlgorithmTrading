import SwiftUI
import AdaptiveSwiftUi

struct SidebarView: View {
    @Binding var isShowing: Bool

    var body: some View {
        ZStack {
            if isShowing {
                // Background overlay
                Color.black.opacity(0.3)
                    .transition(.opacity)
                    .onTapGesture {
                        withAnimation(.spring()) {
                            isShowing = false
                        }
                    }

                // Sidebar content
                HStack {
                    VStack(alignment: .leading, spacing: 20) {
                        HStack {
                            Text("Menu")
                                .font(.title.bold())
                            Spacer()
                            Button(action: {
                                withAnimation(.spring()) {
                                    isShowing = false
                                }
                            }) {
                                Image(systemName: "xmark.circle.fill")
                                    .font(.title2)
                                    .foregroundColor(.gray)
                            }
                        }
                        .padding(.top, 60)

                        Divider()

                        // Menu items
                        VStack(alignment: .leading, spacing: 25) {
                            SidebarItem(icon: "person.circle", title: "Account")
                            SidebarItem(icon: "gearshape", title: "Settings")
                            SidebarItem(icon: "questionmark.circle", title: "Help & Support")
                            SidebarItem(icon: "info.circle", title: "About Lepos")
                        }

                        Spacer()
                    }
                    .padding()
                    .frame(width: 280)
                    .adaptiveGlass(cornerRadius: 5)
                    .padding(.horizontal)
                    .padding(.vertical)
                    Spacer()
                }

                .transition(.move(edge: .leading))
            }
        }
    }
}

struct SidebarItem: View {
    let icon: String
    let title: String

    var body: some View {
        HStack(spacing: 15) {
            Image(systemName: icon)
                .font(.system(size: 20))
                .foregroundColor(.primary)
                .frame(width: 30)

            Text(title)
                .font(.body)
                .foregroundColor(.primary)

            Spacer()
        }
    }
}
