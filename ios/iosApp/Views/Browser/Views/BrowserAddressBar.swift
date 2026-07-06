import ExploreSwiftUI
import SwiftUI

// MARK: - Safari-style Address Bar Wrapper

public struct BrowserAddressBar: View {
    @ObservedObject var viewModel: BrowserViewModel
    @EnvironmentObject var navigation: NavigationViewModel
    public init(viewModel: BrowserViewModel) {
        self.viewModel = viewModel
    }

    public var body: some View {
        if let activeTab = viewModel.activeTab {
            BrowserAddressBarContent(viewModel: viewModel, activeTab: activeTab)
        } else {
            // Fallback placeholder if no tab is active
            HStack {
                Spacer()
                Text("Tìm hoặc nhập tên web")
                    .font(.system(size: 14.5, weight: .semibold))
                    .foregroundColor(.secondary)
                Spacer()
            }
            .padding(.vertical, 12)
            .uniGlass()
        }
    }
}

// MARK: - Address Bar Content (Observing Active Tab)

struct BrowserAddressBarContent: View {
    @ObservedObject var viewModel: BrowserViewModel
    @ObservedObject var activeTab: BrowserTabViewModel // Real-time observation of the tab's progress and state
    @EnvironmentObject var navigation: NavigationViewModel
    @State private var showExtensionsAlert = false

    var body: some View {
        Group {
            if viewModel.isToolbarCollapsed {
                // Collapsed Compact State
                Button {
                    openSearch()
                } label: {
                    Text(displayText)
                        .font(.system(size: 12.5, weight: .semibold))
                        .foregroundColor(.primary)
                        .lineLimit(1)
                        .truncationMode(.tail)
                        .padding(.horizontal, 20)
                        .frame(minHeight: 38)
                        .contentShape(Capsule())
                        .uniGlass()
                        .clipShape(Capsule())
                        .shadow(color: Color.black.opacity(0.08), radius: 6, x: 0, y: 3)
                        .overlay(
                            Capsule()
                                .stroke(Color.primary.opacity(0.08), lineWidth: 0.5)
                        )
                }
                .buttonStyle(.plain)
                .highPriorityGesture(TapGesture().onEnded { _ in openSearch() })
            } else {
                // Expanded Full Address Bar
                HStack(spacing: 8) {
                    Button(action: openSearch) {
                        HStack(spacing: 8) {
                            Image(systemName: isSecureURL ? "lock.fill" : "exclamationmark.triangle.fill")
                                .font(.system(size: 11, weight: .semibold))
                                .foregroundColor(isSecureURL ? .secondary : .orange)

                            Text(displayText)
                                .font(.system(size: 14.5, weight: .semibold))
                                .foregroundColor(activeTab.currentURL == nil ? .secondary : .primary)
                                .lineLimit(1)
                                .truncationMode(.tail)

                            Spacer(minLength: 0)
                        }
                        .padding(.leading, 14)
                        .frame(maxWidth: .infinity, minHeight: 46, alignment: .leading)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .highPriorityGesture(TapGesture().onEnded { _ in openSearch() })

                    BrowserPageSettingsMenuView(
                        viewModel: viewModel,
                        activeTab: activeTab,
                        showExtensionsAlert: $showExtensionsAlert
                    )

                    reloadOrStopButton
                        .padding(.trailing, 14)
                }
                .uniGlass()
                .frame(minHeight: 46)
                .overlay(
                    GeometryReader { geo in
                        VStack {
                            Spacer()
                            if case .loading(let progress) = activeTab.pageState {
                                Color.blue
                                    .frame(width: geo.size.width * CGFloat(progress), height: 3)
                            }
                        }
                    }
                )
                .clipShape(Capsule())
            }
        }
        .alert("Quản lý phần mở rộng", isPresented: $showExtensionsAlert) {
            Button("OK", role: .cancel) {}
        } message: {
            Text("iOS không cho app bên thứ ba quản lý Safari Extensions trực tiếp.")
        }
    }

    // MARK: - Reload / Stop Button

    @ViewBuilder
    private var reloadOrStopButton: some View {
        switch activeTab.pageState {
        case .loading:
            UniButton(action: { activeTab.stopLoading() }) {
                Image(systemName: "xmark")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(.primary)
            }
            .uniButtonStyle(.plain)
        case .loaded:
            UniButton(action: { activeTab.reload() }) {
                Image(systemName: "arrow.clockwise")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(.primary)
            }
            .uniButtonStyle(.plain)
        default:
            EmptyView()
        }
    }

    // MARK: - Helpers

    private var displayText: String {
        guard let url = activeTab.currentURL else {
            return "Tìm hoặc nhập tên web"
        }
        let pageTitle = activeTab.title.trimmingCharacters(in: .whitespacesAndNewlines)
        if !pageTitle.isEmpty && pageTitle != "Tab Mới" && pageTitle != "Website" {
            return pageTitle
        }
        return url.host ?? url.absoluteString
    }

    private var isSecureURL: Bool {
        activeTab.currentURL?.scheme?.lowercased() == "https"
    }

    private func openSearch() {
        navigation.navigate(to: .browserSearch(isPrivate: viewModel.isPrivateMode))
    }
}
