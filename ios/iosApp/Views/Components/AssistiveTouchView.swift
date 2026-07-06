import ExploreSwiftUI
import SwiftUI

struct AssistiveTouchView: View {
    @EnvironmentObject private var navigation: NavigationViewModel
    @State private var dragPosition: CGPoint?
    @State private var isExpanded: Bool = false

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                if isExpanded {
                    // Transparent background to capture taps outside the menu
                    Color.black.opacity(0.001)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .onTapGesture {
                            withAnimation {
                                isExpanded = false
                            }
                        }

                    LazyVGrid(
                        columns: [
                            GridItem(.flexible(), spacing: 16),
                            GridItem(.flexible(), spacing: 16),
                            GridItem(.flexible(), spacing: 16)
                        ],
                        spacing: 16
                    ) {
                        gridItem(title: "Home", icon: "house.fill") {
                            withAnimation { isExpanded = false }
                            navigation.reset()
                        }
                        gridItem(title: "Browser", icon: "safari.fill") {
                            withAnimation { isExpanded = false }
                            navigation.navigate(to: .browser(initialURL: nil, privateMode: false))
                        }
                        gridItem(title: "Yêu thích", icon: "heart.fill") {
                            withAnimation { isExpanded = false }
                            navigation.navigate(to: .favorites)
                        }
                        gridItem(title: "Quay Về", icon: "arrow.uturn.left.circle.fill") {
                            withAnimation { isExpanded = false }
                            navigation.goBackContextually()
                        }
                        gridItem(title: "Đóng", icon: "xmark") {
                            withAnimation {
                                isExpanded = false
                            }
                        }
                        gridItem(title: "Cài đặt", icon: "gearshape.fill") {
                            withAnimation { isExpanded = false }
                            navigation.navigate(to: .settings)
                        }
                        
                        gridItem(title: "Hoạt động", icon: "bell.fill") {
                            withAnimation { isExpanded = false }
                            navigation.navigate(to: .activity)
                        }
                        
                        gridItem(title: "Cập nhật", icon: "arrow.clockwise.circle.fill") {
                            withAnimation { isExpanded = false }
                            navigation.navigate(to: .updates)
                        }
                        gridItem(title: "Tài khoản", icon: "person.crop.circle.fill") {
                            withAnimation { isExpanded = false }
                            navigation.navigate(to: .login)
                        }
                    }
                    .padding(20)
                    .frame(width: 290)
                    .uniGlass(cornerRadius: 24)
                    .position(x: geometry.size.width / 2, y: geometry.size.height / 2)
                    .transition(.scale)
                    .zIndex(0)
                }

                if !isExpanded {
                    UniButton(action: {
                        withAnimation {
                            isExpanded.toggle()
                        }
                    }) {
                        Image(systemName: "livephoto")
                            .font(.system(size: 40))
                            .foregroundColor(.primary)
                            .frame(width: 60, height: 60)
                    }
                    .uniGlass(cornerRadius: 100)
                    .position(
                        dragPosition
                            ?? CGPoint(x: geometry.size.width - 50, y: geometry.size.height - 150)
                    )
                    .highPriorityGesture(
                        DragGesture()
                            .onChanged { gesture in
                                self.dragPosition = gesture.location
                            }
                            .onEnded { value in
                                var currentPosition = value.location

                                if currentPosition.x > (geometry.size.width / 2) {
                                    currentPosition.x = geometry.size.width - 40
                                } else {
                                    currentPosition.x = 40
                                }

                                let minY: CGFloat = 80
                                let maxY: CGFloat = geometry.size.height - 80
                                currentPosition.y = min(max(currentPosition.y, minY), maxY)

                                withAnimation(.spring(response: 0.5, dampingFraction: 0.7)) {
                                    dragPosition = currentPosition
                                }
                            }
                    )
                    .zIndex(1)
                }
            }
        }
    }

    private func gridItem(title: String, icon: String, action: @escaping () -> Void) -> some View {
        UniButton(action: action) {
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.system(size: 24, weight: .semibold))
                    .foregroundColor(.primary)
                    .frame(width: 54, height: 54)
                    .background(
                        Circle()
                            .fill(Color.primary.opacity(0.06))
                    )
                
                Text(title)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(.primary)
                    .lineLimit(1)
            }
            .frame(width: 72, height: 80)
        }
        .uniButtonStyle(.plain)
    }
}
