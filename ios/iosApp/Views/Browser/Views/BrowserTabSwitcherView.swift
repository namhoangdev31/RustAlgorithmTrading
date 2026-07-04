import ExploreSwiftUI
import SwiftUI

// MARK: - Safari-style Tab Switcher

public struct BrowserTabSwitcherView: View {
    @ObservedObject var viewModel: BrowserViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var showPrivateGroupPicker = false

    public init(viewModel: BrowserViewModel) {
        self.viewModel = viewModel
    }

    public var body: some View {
        ZStack(alignment: .bottom) {
            // Background
            Color(UIColor.systemGroupedBackground)
                .ignoresSafeArea()

            // Top bar
            VStack(spacing: 0) {
                topBar
                    .padding(.top, safeAreaTop)

                // Tab grid
                UniScrollView {
                    LazyVGrid(
                        columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)],
                        spacing: 14
                    ) {
                        ForEach(viewModel.tabs) { tabVM in
                            SafariTabCard(
                                tabVM: tabVM,
                                isActive: tabVM.id == viewModel.activeTabId
                            ) {
                                viewModel.switchTab(to: tabVM.id)
                                dismiss()
                            } onClose: {
                                withAnimation(.spring(response: 0.3)) {
                                    viewModel.closeTab(id: tabVM.id)
                                }
                            }
                        }
                    }
                    .padding(.horizontal, 14)
                    .padding(.top, 8)
                    .padding(.bottom, 110)
                }
            }

            // Bottom control bar (Safari-style)
            bottomBar
        }
        .ignoresSafeArea()
    }

    // MARK: - Top Bar

    private var topBar: some View {
        HStack {
            // More menu (...)
            UniMenu {
                Button(action: {
                    viewModel.createNewTab()
                    dismiss()
                }) {
                    Label("Tab mới", systemImage: "plus")
                }
                Button(action: {
                    viewModel.isPrivateMode = true
                    viewModel.createNewTab()
                    dismiss()
                }) {
                    Label("Tab riêng tư mới", systemImage: "hand.raised")
                }
                Divider()
                Button(action: {
                    dismiss()
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                        viewModel.showBookmarksList = true
                    }
                }) {
                    Label("Dấu trang", systemImage: "book")
                }
            } label: {
                Image(systemName: "ellipsis")
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(.primary)
                    .frame(width: 36, height: 36)
                    .background(Circle().fill(Color(UIColor.secondarySystemFill)))
            }

            Spacer()

            // Search button
            UniButton(action: {
                dismiss()
            }) {
                Image(systemName: "magnifyingglass")
                    .font(.system(size: 17))
                    .foregroundColor(.primary)
                    .frame(width: 36, height: 36)
                    .background(Circle().fill(Color(UIColor.secondarySystemFill)))
            }
            .uniButtonStyle(.plain)
        }
        .padding(.horizontal, 16)
        .padding(.bottom, 8)
    }

    // MARK: - Bottom Bar

    private var bottomBar: some View {
        VStack(spacing: 0) {
            Divider()

            HStack(spacing: 0) {
                // New tab button
                UniButton(action: {
                    viewModel.createNewTab()
                    dismiss()
                }) {
                    Image(systemName: "plus")
                        .font(.system(size: 20, weight: .regular))
                        .foregroundColor(.primary)
                        .frame(maxWidth: .infinity)
                        .frame(height: 44)
                }
                .uniButtonStyle(.plain)

                // Private mode toggle
                UniButton(action: {
                    viewModel.isPrivateMode.toggle()
                }) {
                    Text(viewModel.isPrivateMode ? "Riêng tư" : "Riêng tư")
                        .font(.system(size: 14, weight: .regular))
                        .foregroundColor(viewModel.isPrivateMode ? .purple : .secondary)
                        .frame(maxWidth: .infinity)
                        .frame(height: 44)
                }
                .uniButtonStyle(.plain)

                // Tab count / Done button
                UniButton(action: { dismiss() }) {
                    ZStack {
                        Circle()
                            .fill(Color.blue)
                            .frame(width: 36, height: 36)
                        Image(systemName: "checkmark")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(.white)
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 44)
                }
                .uniButtonStyle(.plain)
            }
            .padding(.horizontal, 8)
            .padding(.bottom, max(safeAreaBottom, 12))
            .background(
                Color(UIColor.systemBackground)
                    .opacity(0.95)
                    .background(.regularMaterial)
            )
        }
    }

    private var safeAreaTop: CGFloat {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .first?.windows.first?.safeAreaInsets.top ?? 44
    }

    private var safeAreaBottom: CGFloat {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .first?.windows.first?.safeAreaInsets.bottom ?? 0
    }
}

// MARK: - Tab Card (Safari-style)

struct SafariTabCard: View {
    @ObservedObject var tabVM: BrowserTabViewModel
    let isActive: Bool
    let onTap: () -> Void
    let onClose: () -> Void

    @State private var showContextMenu = false

    var body: some View {
        ZStack(alignment: .topTrailing) {
            // Card body
            VStack(spacing: 0) {
                // Thumbnail area
                ZStack {
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .fill(Color(UIColor.systemBackground))

                    // Placeholder (no screenshot support)
                    VStack(spacing: 8) {
                        Image(systemName: tabVM.isPrivate ? "hand.raised.fill" : "safari")
                            .font(.system(size: 36))
                            .foregroundColor(Color(UIColor.quaternaryLabel))

                        if let host = tabVM.currentURL?.host {
                            Text(host)
                                .font(.caption2)
                                .foregroundColor(Color(UIColor.tertiaryLabel))
                                .lineLimit(1)
                        }
                    }
                }
                .frame(maxWidth: .infinity)
                .frame(height: 160)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

                // Title bar
                HStack(spacing: 6) {
                    if tabVM.isPrivate {
                        Image(systemName: "hand.raised.fill")
                            .font(.system(size: 10))
                            .foregroundColor(.purple)
                    } else if isActive {
                        Image(systemName: "pin.fill")
                            .font(.system(size: 10))
                            .foregroundColor(.orange)
                    }

                    Text(tabVM.title)
                        .font(.caption.weight(isActive ? .semibold : .regular))
                        .foregroundColor(.primary)
                        .lineLimit(1)

                    Spacer(minLength: 0)
                }
                .padding(.horizontal, 4)
                .padding(.vertical, 6)
            }
            .contentShape(Rectangle())
            .onTapGesture { onTap() }
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .strokeBorder(
                        isActive ? Color.blue : Color(UIColor.separator),
                        lineWidth: isActive ? 2.5 : 0.5
                    )
            )
            .contextMenu {
                Button(action: {}) {
                    Label("Sao chép liên kết", systemImage: "link")
                }
                Button(action: {}) {
                    Label("Ghim Tab", systemImage: "pin")
                }
                Button(action: {}) {
                    Label("Nhân bản tab", systemImage: "plus.square.on.square")
                }
                Divider()
                Button(role: .destructive, action: onClose) {
                    Label("Đóng tab", systemImage: "xmark")
                }
            }

            // Close (X) button
            UniButton(action: onClose) {
                Image(systemName: "xmark")
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundColor(.primary)
                    .frame(width: 22, height: 22)
                    .background(
                        Circle()
                            .fill(Color(UIColor.systemFill))
                            .shadow(color: .black.opacity(0.1), radius: 2)
                    )
            }
            .uniButtonStyle(.plain)
            .padding(6)
        }
    }
}
