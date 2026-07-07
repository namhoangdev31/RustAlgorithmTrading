import SwiftUI
import WebKit

struct RuntimeAppSwitcherView: View {
    let tabs: [WebTab]
    let activeTabId: UUID?
    @Binding var isPresented: Bool
    let onSelect: (UUID) -> Void
    let onAdd: () -> Void
    let onClose: (UUID) -> Void
    @State private var focusedIndex: Int = 0
    @State private var dragX: CGFloat = 0
    @GestureState private var isDragging: Bool = false
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass

    var body: some View {
        GeometryReader { geometry in
            let metrics = DeckMetrics.make(
                size: geometry.size,
                safeAreaInsets: geometry.safeAreaInsets,
                horizontalSizeClass: horizontalSizeClass
            )

            ZStack {
                background

                if tabs.isEmpty {
                    emptyStateView
                } else {
                    VStack(spacing: 0) {
                        headerView
                        deckView(metrics: metrics)
                        bottomBarView
                    }
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .preferredColorScheme(.dark)
        .onAppear {
            syncFocusedIndex(preferActiveTab: true)
        }
        .onChange(of: tabs.map(\.id)) { _, _ in
            syncFocusedIndex(preferActiveTab: false)
        }
        .onChange(of: activeTabId) { _, _ in
            syncFocusedIndex(preferActiveTab: true)
        }
    }

    private var background: some View {
        Color(red: 0.05, green: 0.05, blue: 0.07).ignoresSafeArea()
    }

    private var emptyStateView: some View {
        VStack(spacing: 24) {
            Spacer()
            Image(systemName: "rectangle.on.rectangle.slash.fill")
                .font(.system(size: 60))
                .foregroundStyle(.secondary)
            Text("Không có tab runtime nào")
                .font(.headline)
                .foregroundStyle(.secondary)
            Spacer()
            HStack(spacing: 16) {
                Button(action: onAdd) {
                    Label("Mở tab runtime mới", systemImage: "plus")
                        .font(.headline)
                        .frame(minWidth: 132, minHeight: 44)
                }
                .buttonStyle(.borderedProminent)
                .accessibilityLabel("Mở tab runtime mới")

                Button(action: dismiss) {
                    Text("Xong")
                        .font(.headline)
                        .frame(minWidth: 76, minHeight: 44)
                }
                .buttonStyle(.bordered)
                .accessibilityLabel("Đóng trình chuyển tab")
            }
            .padding(.bottom, 40)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var headerView: some View {
        HStack {
            Text("WebRuntime Switcher")
                .font(.title2.weight(.bold))
                .foregroundStyle(.white)
            Spacer()
            Button(action: dismiss) {
                Image(systemName: "xmark.circle.fill")
                    .font(.system(size: 28))
                    .foregroundStyle(.secondary)
                    .frame(width: 44, height: 44)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Đóng trình chuyển tab")
        }
        .padding(.horizontal, 20)
        .padding(.top, 20)
    }

    private func deckView(metrics: DeckMetrics) -> some View {
        ZStack {
            ZStack {
                ForEach(visibleIndices(metrics: metrics).reversed(), id: \.self) { index in
                    let tab = tabs[index]
                    let transform = transform(for: index, metrics: metrics)

                    RuntimeSwitcherCard(
                        tab: tab,
                        isFocused: index == focusedIndex,
                        onSelect: {
                            onSelect(tab.id)
                            dismiss()
                        },
                        onClose: {
                            closeTab(at: index)
                        }
                    )
                    .frame(width: metrics.cardWidth, height: metrics.cardHeight)
                    .offset(x: transform.x, y: transform.y)
                    .scaleEffect(transform.scale)
                    .rotation3DEffect(
                        .degrees(transform.rotation),
                        axis: (x: 0, y: 1, z: 0),
                        perspective: 0.7
                    )
                    .opacity(transform.opacity)
                    .zIndex(transform.zIndex)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .gesture(
                DragGesture(minimumDistance: 8)
                    .updating($isDragging) { _, state, _ in
                        state = true
                    }
                    .onChanged { value in
                        dragX = value.translation.width
                    }
                    .onEnded { value in
                        endDrag(value, metrics: metrics)
                    }
            )
            .animation(
                .interactiveSpring(response: 0.34, dampingFraction: 0.82),
                value: focusedIndex
            )
            .animation(
                .interactiveSpring(response: 0.28, dampingFraction: 0.9),
                value: dragX
            )
        }
        .contentShape(Rectangle())
        .padding(.vertical, 8)
    }

    private var bottomBarView: some View {
        HStack {
            Button(action: onAdd) {
                Image(systemName: "plus")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(.blue)
                    .frame(width: 44, height: 44)
                    .background(Circle().fill(Color.white.opacity(0.11)))
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Mở tab runtime mới")

            Spacer()
            Text(tabs.count == 1 ? "1 Tab" : "\(tabs.count) Tabs")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(.white.opacity(0.8))
            Spacer()
            Button(action: dismiss) {
                Image(systemName: "checkmark")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(.blue)
                    .frame(width: 44, height: 44)
                    .background(Circle().fill(Color.white.opacity(0.11)))
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Đóng trình chuyển tab")
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 24)
        .padding(.top, 12)
    }

    private var safeFocusedIndex: Int? {
        guard !tabs.isEmpty else { return nil }
        return min(max(focusedIndex, 0), tabs.count - 1)
    }

    private func syncFocusedIndex(preferActiveTab: Bool) {
        guard !tabs.isEmpty else {
            focusedIndex = 0
            dragX = 0
            return
        }

        if preferActiveTab,
           let activeTabId,
           let activeIndex = tabs.firstIndex(where: { $0.id == activeTabId }) {
            focusedIndex = activeIndex
        } else {
            focusedIndex = min(max(focusedIndex, 0), tabs.count - 1)
        }
        dragX = 0
    }

    private func visibleIndices(metrics: DeckMetrics) -> [Int] {
        guard let safeIndex = safeFocusedIndex else { return [] }
        let lower = max(0, safeIndex - metrics.visibleRadius)
        let upper = min(tabs.count - 1, safeIndex + metrics.visibleRadius)
        guard lower <= upper else { return [] }
        return Array(lower...upper)
    }

    private func transform(for index: Int, metrics: DeckMetrics) -> CardTransform {
        let safeIndex = safeFocusedIndex ?? 0
        let relative = CGFloat(index - safeIndex)
        let dragProgress = dragX / metrics.cardSpacing
        let effectiveRelative = relative - dragProgress
        let distance = abs(effectiveRelative)
        let curvedOffset = effectiveRelative * metrics.cardSpacing
        let compressedOffset = CGFloat(tanh(Double(effectiveRelative / 3.0))) * metrics.maxSideOffset
        let x = curvedOffset * 0.35 + compressedOffset * 0.65
        let scale = max(metrics.minScale, 1.0 - distance * metrics.scaleStep)
        let y = distance * metrics.verticalStep
        let rotation = max(
            -metrics.maxRotation,
            min(metrics.maxRotation, effectiveRelative * metrics.rotationStep)
        )
        let opacity = Double(max(0.25, 1.0 - distance * 0.18))
        let zIndex = Double(1000 - distance * 10)

        return CardTransform(
            x: x,
            y: y,
            scale: scale,
            rotation: rotation,
            opacity: opacity,
            zIndex: zIndex
        )
    }

    private func endDrag(_ value: DragGesture.Value, metrics: DeckMetrics) {
        guard let safeIndex = safeFocusedIndex else {
            dragX = 0
            return
        }

        let predicted = value.predictedEndTranslation.width
        let threshold = metrics.cardSpacing * 0.65
        var newIndex = safeIndex

        if predicted < -threshold {
            newIndex = min(tabs.count - 1, safeIndex + 1)
        } else if predicted > threshold {
            newIndex = max(0, safeIndex - 1)
        }

        withAnimation(.interactiveSpring(response: 0.34, dampingFraction: 0.82)) {
            focusedIndex = newIndex
            dragX = 0
        }
    }

    private func closeTab(at index: Int) {
        guard index >= 0 && index < tabs.count else { return }
        let tabId = tabs[index].id

        if tabs.count == 1 {
            focusedIndex = 0
        } else if index == focusedIndex {
            focusedIndex = min(index, tabs.count - 2)
        } else if index < focusedIndex {
            focusedIndex = max(0, focusedIndex - 1)
        } else {
            focusedIndex = min(focusedIndex, tabs.count - 2)
        }

        dragX = 0
        onClose(tabId)
    }

    private func dismiss() {
        withAnimation(.easeInOut(duration: 0.18)) {
            isPresented = false
        }
    }
}

private struct DeckMetrics {
    let cardWidth: CGFloat
    let cardHeight: CGFloat
    let cardSpacing: CGFloat
    let maxSideOffset: CGFloat
    let scaleStep: CGFloat
    let minScale: CGFloat
    let rotationStep: CGFloat
    let maxRotation: CGFloat
    let verticalStep: CGFloat
    let visibleRadius: Int

    static func make(
        size: CGSize,
        safeAreaInsets: EdgeInsets,
        horizontalSizeClass: UserInterfaceSizeClass?
    ) -> DeckMetrics {
        let isPad = horizontalSizeClass == .regular
        let shortest = min(size.width, size.height)
        let usableHeight = max(280, size.height - safeAreaInsets.top - safeAreaInsets.bottom - 148)
        let targetWidth = isPad ? min(size.width * 0.52, 520) : min(size.width * 0.78, 360)
        let cardWidth = min(max(220, targetWidth), max(220, size.width - 40))
        let targetHeight = isPad ? min(usableHeight * 0.86, 680) : min(usableHeight * 0.92, 620)

        return DeckMetrics(
            cardWidth: cardWidth,
            cardHeight: cardHeight,
            cardSpacing: max(56, min(shortest * 0.11, 96)),
            maxSideOffset: max(220, min(size.width * 0.36, 420)),
            scaleStep: isPad ? 0.045 : 0.055,
            minScale: isPad ? 0.86 : 0.82,
            rotationStep: isPad ? 3.0 : 4.0,
            maxRotation: isPad ? 9.0 : 12.0,
            verticalStep: isPad ? 8.0 : 10.0,
            visibleRadius: isPad ? 5 : 4
        )
    }
}

private struct CardTransform {
    let x: CGFloat
    let y: CGFloat
    let scale: CGFloat
    let rotation: CGFloat
    let opacity: Double
    let zIndex: Double
}

private struct RuntimeSwitcherCard: View {
    @ObservedObject var tab: WebTab
    let isFocused: Bool
    let onSelect: () -> Void
    let onClose: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 0) {
                HStack {
                    Image(systemName: "globe")
                        .font(.system(size: 14))
                        .foregroundStyle(.blue)

                    Text(tab.title.isEmpty ? "Tab không tên" : tab.title)
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(.white)
                        .lineLimit(1)
                        .minimumScaleFactor(0.75)

                    Spacer()
                }
                .contentShape(Rectangle())
                .onTapGesture(perform: onSelect)

                Button(action: onClose) {
                    Image(systemName: "xmark")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(width: 28, height: 28)
                        .background(Circle().fill(Color.white.opacity(0.15)))
                        .frame(width: 44, height: 44)
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Đóng tab \(tab.title.isEmpty ? "này" : tab.title)")
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(Color.white.opacity(0.08))

            ZStack {
                if let snapshot = tab.cachedSnapshot {
                    Image(uiImage: snapshot)
                        .resizable()
                        .scaledToFill()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .clipped()
                } else {
                    Color.white.opacity(0.04)

                    VStack(spacing: 12) {
                        Image(systemName: statusIconName)
                            .font(.system(size: 40))
                            .foregroundStyle(.secondary)
                        Text(statusText)
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .contentShape(Rectangle())
            .onTapGesture(perform: onSelect)

            HStack {
                Circle()
                    .fill(statusColor)
                    .frame(width: 6, height: 6)
                Text(statusText)
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.75))
                Spacer()
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(Color.white.opacity(0.05))
            .contentShape(Rectangle())
            .onTapGesture(perform: onSelect)
        }
        .background(Color(red: 0.1, green: 0.1, blue: 0.12))
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(isFocused ? Color.blue : Color.white.opacity(0.12), lineWidth: isFocused ? 2 : 1)
        )
        .shadow(color: Color.black.opacity(isFocused ? 0.35 : 0.15), radius: isFocused ? 12 : 6)
        .contentShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        .accessibilityElement(children: .combine)
        .accessibilityLabel(tab.title.isEmpty ? "Tab runtime" : tab.title)
        .accessibilityHint("Mở tab runtime")
        .accessibilityAddTraits(isFocused ? AccessibilityTraits.isSelected : AccessibilityTraits())
        .accessibilityAction {
            onSelect()
        }
    }

    private var statusIconName: String {
        switch tab.status {
        case .loading: return "hourglass"
        case .active: return "play.circle"
        case .paused: return "pause.circle"
        case .suspended: return "moon"
        case .closing, .closed: return "xmark.circle"
        }
    }

    private var statusText: String {
        switch tab.status {
        case .loading: return "Đang tải..."
        case .active: return "Đang chạy"
        case .paused: return "Tạm dừng"
        case .suspended: return "Đang ngủ"
        case .closing, .closed: return "Đã đóng"
        }
    }

    private var statusColor: Color {
        switch tab.status {
        case .loading: return .orange
        case .active: return .green
        case .paused: return .yellow
        case .suspended: return .gray
        case .closing, .closed: return .red
        }
    }
}

@MainActor
extension WKWebView {
    func takeSnapshot() async -> UIImage? {
        guard window != nil, bounds.width >= 1, bounds.height >= 1 else {
            return nil
        }

        let configuration = WKSnapshotConfiguration()
        configuration.rect = bounds

        return await withCheckedContinuation { continuation in
            takeSnapshot(with: configuration) { image, error in
                #if DEBUG
                if let error {
                    print("[WKWebView+Snapshot] \(error.localizedDescription)")
                }
                #endif
                continuation.resume(returning: image)
            }
        }
    }
}
