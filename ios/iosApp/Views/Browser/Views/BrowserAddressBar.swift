import ExploreSwiftUI
import SwiftUI

// MARK: - Safari-style Address Bar Wrapper

public struct BrowserAddressBar: View {
    @ObservedObject var viewModel: BrowserViewModel
    let focusOnAppear: Bool

    public init(viewModel: BrowserViewModel, focusOnAppear: Bool = false) {
        self.viewModel = viewModel
        self.focusOnAppear = focusOnAppear
    }

    public var body: some View {
        if let activeTab = viewModel.activeTab {
            BrowserAddressBarContent(viewModel: viewModel, activeTab: activeTab, focusOnAppear: focusOnAppear)
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
    let focusOnAppear: Bool

    @FocusState private var isTextFieldFocused: Bool
    @State private var editingText: String = ""

    var body: some View {
        if viewModel.isToolbarCollapsed {
            // Collapsed Compact State (Looks exactly like Safari Image 1)
            Text(displayText)
                .font(.system(size: 12.5, weight: .semibold))
                .foregroundColor(.primary)
                .lineLimit(1)
                .truncationMode(.tail)
                .padding(.horizontal, 20)
                .padding(.vertical, 7)
                .background(Color.clear)
                .uniGlass()
                .clipShape(Capsule())
                .shadow(color: Color.black.opacity(0.08), radius: 6, x: 0, y: 3)
                .overlay(
                    Capsule()
                        .stroke(Color.primary.opacity(0.08), lineWidth: 0.5)
                )
                .onTapGesture {
                    withAnimation(.easeInOut(duration: 0.25)) {
                        viewModel.isToolbarCollapsed = false
                    }
                }
        } else {
            // Expanded Full Address Bar
            HStack(spacing: 6) {
                Image(systemName: isSecureURL ? "lock.fill" : "magnifyingglass")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(.secondary)

                // Stable TextField
                TextField("Tìm hoặc nhập tên web", text: $editingText)
                    .keyboardType(.webSearch)
                    .autocapitalization(.none)
                    .disableAutocorrection(true)
                    .focused($isTextFieldFocused)
                    .font(.system(size: 14.5, weight: .semibold))
                    .submitLabel(.go)
                    .onSubmit {
                        viewModel.loadURLString(editingText)
                        isTextFieldFocused = false
                    }
                    .opacity(isTextFieldFocused ? 1.0 : 0.0)
                    .overlay(
                        // Overlay non-editable text when NOT focused
                        Group {
                            if !isTextFieldFocused {
                                HStack {
                                    Text(displayText)
                                        .font(.system(size: 14.5, weight: .semibold))
                                        .foregroundColor(activeTab.currentURL == nil ? .secondary : .primary)
                                        .lineLimit(1)
                                        .truncationMode(.tail)
                                    Spacer()
                                }
                                .contentShape(Rectangle())
                                .onTapGesture {
                                    editingText = activeTab.currentURL?.absoluteString ?? ""
                                    isTextFieldFocused = true
                                }
                            }
                        }
                    )

                Spacer(minLength: 0)

                // Right actions (Reload/Stop or Cancel)
                if isTextFieldFocused {
                    if !editingText.isEmpty {
                        UniButton(action: { editingText = "" }) {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(Color(UIColor.tertiaryLabel))
                                .font(.system(size: 15))
                        }
                        .uniButtonStyle(.plain)
                    }
                    
                    UniButton(action: { isTextFieldFocused = false }) {
                        Text("Huỷ")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.blue)
                    }
                    .uniButtonStyle(.plain)
                } else {
                    reloadOrStopButton
                }
            }
            .padding(.leading, 12)
            .padding(.trailing, 16)
            .padding(.vertical, 12)
            .uniGlass()
            .overlay(
                // Real-time blue progress bar indicator at the bottom edge
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
            .animation(.easeInOut(duration: 0.2), value: isTextFieldFocused)
            .onAppear {
                if focusOnAppear {
                    editingText = ""
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                        isTextFieldFocused = true
                    }
                }
            }
            .onChange(of: isTextFieldFocused) { focused in
                if !focused {
                    viewModel.syncAddressBar()
                }
            }
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
}
