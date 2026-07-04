import ExploreSwiftUI
import SwiftUI

struct AssistiveTouchView: View {
    @EnvironmentObject var navigation: NavigationViewModel
    @Environment(\.colorScheme) private var colorScheme
    @State private var dragPosition: CGPoint?
    @State private var dragStartLocation: CGPoint? = nil
    @State private var isExpanded: Bool = false
    @State private var isIdle: Bool = false
    @State private var isDragging: Bool = false
    @State private var idleTimerTask: Task<Void, Never>? = nil

    private let menuWidth: CGFloat = 280
    private let menuHeight: CGFloat = 280

    private struct AssistiveItem: Identifiable {
        let id = UUID()
        let title: String
        let icon: String
        let action: (NavigationViewModel, Binding<Bool>) -> Void
    }

    private let items: [AssistiveItem] = [
        AssistiveItem(title: "Trang chủ", icon: "house.fill") { nav, isExpanded in
            nav.reset()
            isExpanded.wrappedValue = false
        },
        AssistiveItem(title: "Duyệt web", icon: "safari.fill") { nav, isExpanded in
            nav.navigate(to: .browser(initialURL: nil, privateMode: false))
            isExpanded.wrappedValue = false
        },
        AssistiveItem(title: "Yêu thích", icon: "star.fill") { nav, isExpanded in
            nav.navigate(to: .favorites)
            isExpanded.wrappedValue = false
        },
        AssistiveItem(title: "Quay lại", icon: "arrow.backward") { nav, isExpanded in
            nav.goBack()
            isExpanded.wrappedValue = false
        },
        AssistiveItem(title: "Đóng", icon: "xmark") { _, isExpanded in
            isExpanded.wrappedValue = false
        },
        AssistiveItem(title: "Ví cá nhân", icon: "creditcard.fill") { nav, isExpanded in
            nav.navigate(to: .wallet)
            isExpanded.wrappedValue = false
        },
        AssistiveItem(title: "Thông báo", icon: "bell.fill") { nav, isExpanded in
            nav.navigate(to: .notifications)
            isExpanded.wrappedValue = false
        },
        AssistiveItem(title: "Cài đặt", icon: "gearshape.fill") { nav, isExpanded in
            nav.navigate(to: .settings)
            isExpanded.wrappedValue = false
        },
        AssistiveItem(title: "Hỗ trợ", icon: "questionmark.circle.fill") { nav, isExpanded in
            nav.navigate(to: .helpSupport)
            isExpanded.wrappedValue = false
        }
    ]

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                // MARK: Expanded Backdrop Overlay
                if isExpanded {
                    Color.black.opacity(colorScheme == .dark ? 0.45 : 0.25)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .ignoresSafeArea()
                        .transition(.opacity)
                        .onTapGesture {
                            withAnimation(.spring(response: 0.35, dampingFraction: 0.8)) {
                                isExpanded = false
                                resetIdleTimer()
                            }
                        }

                    // MARK: Expanded Grid Panel
                    expandedMenuPanel(geometry: geometry)
                        .transition(.asymmetric(
                            insertion: .scale(scale: 0.5).combined(with: .opacity),
                            removal: .scale(scale: 0.5).combined(with: .opacity)
                        ))
                        .zIndex(2)
                }

                // MARK: Collapsed Button (Assistive Touch circular button)
                if !isExpanded {
                    collapsedTouchButton(geometry: geometry)
                        .zIndex(3)
                }
            }
            .onAppear {
                resetIdleTimer()
            }
            .onDisappear {
                idleTimerTask?.cancel()
            }
        }
    }

    // MARK: - Expanded Panel View

    private func expandedMenuPanel(geometry: GeometryProxy) -> some View {
        VStack(spacing: 0) {
            LazyVGrid(
                columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: 3),
                spacing: 14
            ) {
                ForEach(items) { item in
                    UniButton(action: {
                        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                        withAnimation(.spring(response: 0.35, dampingFraction: 0.8)) {
                            item.action(navigation, $isExpanded)
                            if !isExpanded {
                                resetIdleTimer()
                            }
                        }
                    }) {
                        VStack(spacing: 6) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 14, style: .continuous)
                                    .fill(Color.leposSurface.opacity(0.12))
                                    .frame(width: 54, height: 54)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 14)
                                            .stroke(Color.leposOutline.opacity(0.15), lineWidth: 0.5)
                                    )

                                Image(systemName: item.icon)
                                    .font(.system(size: 20, weight: .medium))
                                    .foregroundColor(item.title == "Đóng" ? Color.leposError : Color.leposOnBackground)
                            }

                            Text(item.title)
                                .font(.system(size: 10.5, weight: .regular))
                                .foregroundColor(Color.leposOnBackground.opacity(0.9))
                                .lineLimit(1)
                        }
                    }
                    .uniButtonStyle(.plain)
                }
            }
            .padding(16)
        }
        .frame(width: menuWidth, height: menuHeight)
        .uniGlass(
            cornerRadius: 24,
            tint: Color.leposSurface.opacity(0.85),
            interactive: true,
            fallbackMaterial: .ultraThick
        )
        .overlay(
            RoundedRectangle(cornerRadius: 24)
                .stroke(Color.leposOutline.opacity(0.2), lineWidth: 0.5)
        )
        .position(x: geometry.size.width / 2, y: geometry.size.height / 2)
    }

    // MARK: - Collapsed Button View

    private func collapsedTouchButton(geometry: GeometryProxy) -> some View {
        let defaultPosition = CGPoint(x: geometry.size.width - 45, y: geometry.size.height - 150)
        let resolvedPosition = dragPosition ?? defaultPosition

        return ZStack {
            // Main outer glass shell matching Apple's touch design with brand colors
            Circle()
                .fill(Color.leposSurface.opacity(isIdle ? 0.35 : 0.65))
                .frame(width: 58, height: 58)
                .overlay(
                    Circle()
                        .stroke(Color.leposOutline.opacity(isIdle ? 0.2 : 0.45), lineWidth: 1.5)
                )

            // Middle ring
            Circle()
                .stroke(Color.leposOnSurface.opacity(isIdle ? 0.3 : 0.6), lineWidth: 3.5)
                .frame(width: 44, height: 44)

            // Inner solid core
            Circle()
                .fill(Color.leposOnSurface.opacity(isIdle ? 0.45 : 0.8))
                .frame(width: 28, height: 28)
        }
        .contentShape(Circle())
        .shadow(color: Color.black.opacity(isIdle ? 0.2 : 0.4), radius: 8, x: 0, y: 4)
        .scaleEffect(isDragging ? 1.15 : (isIdle ? 0.88 : 1.0))
        .opacity(1.0)
        .position(resolvedPosition)
        .onTapGesture {
            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
            idleTimerTask?.cancel()
            withAnimation(.spring(response: 0.35, dampingFraction: 0.75)) {
                isExpanded = true
                isIdle = false
            }
        }
        .gesture(
            DragGesture(minimumDistance: 4)
                .onChanged { value in
                    idleTimerTask?.cancel()
                    isIdle = false
                    
                    // Capture starting position on drag start to prevent coordinate shifts
                    let startLoc = dragStartLocation ?? dragPosition ?? defaultPosition
                    if dragStartLocation == nil {
                        dragStartLocation = startLoc
                        isDragging = true
                    }
                    
                    // Add translation offset to starting position for stable tracking
                    let targetX = startLoc.x + value.translation.width
                    let targetY = startLoc.y + value.translation.height
                    
                    // Clamping to screen boundaries
                    let clampedX = min(max(targetX, 35), geometry.size.width - 35)
                    let clampedY = min(max(targetY, 75), geometry.size.height - 75)
                    
                    withAnimation(.interactiveSpring(response: 0.15, dampingFraction: 0.65)) {
                        dragPosition = CGPoint(x: clampedX, y: clampedY)
                    }
                }
                .onEnded { value in
                    dragStartLocation = nil
                    withAnimation(.spring(response: 0.38, dampingFraction: 0.68)) {
                        isDragging = false
                        var currentPosition = dragPosition ?? resolvedPosition

                        // Snap horizontally to the nearest edge padding dynamically
                        let edgePadding: CGFloat = 42
                        let leftDistance = currentPosition.x
                        let rightDistance = geometry.size.width - currentPosition.x
                        
                        currentPosition.x = leftDistance < rightDistance ? edgePadding : geometry.size.width - edgePadding

                        // Constrain vertically inside safe boundaries
                        let minY: CGFloat = 90
                        let maxY: CGFloat = geometry.size.height - 90
                        currentPosition.y = min(max(currentPosition.y, minY), maxY)

                        dragPosition = currentPosition
                    }
                    UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                    resetIdleTimer()
                }
        )
    }

    // MARK: - Idle Timer Helper

    private func resetIdleTimer() {
        idleTimerTask?.cancel()
        isIdle = false

        idleTimerTask = Task {
            try? await Task.sleep(nanoseconds: 3_500_000_000)
            guard !Task.isCancelled else { return }

            withAnimation(.easeInOut(duration: 0.8)) {
                isIdle = true
            }
        }
    }
}
