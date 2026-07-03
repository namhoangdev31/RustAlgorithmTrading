import ExploreSwiftUI
import SwiftUI

// MARK: - Safari-style Address Bar (used in BrowserDetailView)

public struct BrowserAddressBar: View {
    @ObservedObject var viewModel: BrowserViewModel
    let focusOnAppear: Bool
    @FocusState private var isTextFieldFocused: Bool
    @State private var editingText: String = ""

    public init(viewModel: BrowserViewModel, focusOnAppear: Bool = false) {
        self.viewModel = viewModel
        self.focusOnAppear = focusOnAppear
    }

    public var body: some View {
        Group {
            if isTextFieldFocused {
                expandedSearchBar
            } else {
                collapsedAddressBar
            }
        }
        .onAppear {
            if focusOnAppear {
                editingText = ""
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                    isTextFieldFocused = true
                }
            }
        }
    }

    // MARK: - Collapsed (pill showing domain)

    private var collapsedAddressBar: some View {
        HStack(spacing: 8) {
            // Lock/globe icon
            Image(systemName: isSecureURL ? "lock.fill" : "magnifyingglass")
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(isSecureURL ? .secondary : .secondary)

            Text(displayText)
                .font(.system(size: 14))
                .foregroundColor(viewModel.activeTab?.currentURL == nil ? .secondary : .primary)
                .lineLimit(1)
                .truncationMode(.middle)

            Spacer(minLength: 0)

            reloadOrStopButton
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(
            Capsule()
                .fill(Color(UIColor.secondarySystemFill))
        )
        .onTapGesture {
            editingText = viewModel.activeTab?.currentURL?.absoluteString ?? ""
            isTextFieldFocused = true
        }
    }

    // MARK: - Expanded (editing mode)

    private var expandedSearchBar: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 14))
                .foregroundColor(.secondary)

            TextField("Tìm hoặc nhập tên web", text: $editingText)
                .keyboardType(.webSearch)
                .autocapitalization(.none)
                .disableAutocorrection(true)
                .focused($isTextFieldFocused)
                .font(.system(size: 15))
                .submitLabel(.go)
                .onSubmit {
                    viewModel.loadURLString(editingText)
                    isTextFieldFocused = false
                }

            if !editingText.isEmpty {
                UniButton(action: { editingText = "" }) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(Color(UIColor.tertiaryLabel))
                        .font(.system(size: 16))
                }
                .uniButtonStyle(.plain)
            }

            UniButton(action: { isTextFieldFocused = false }) {
                Text("Huỷ")
                    .font(.subheadline)
                    .foregroundColor(.blue)
            }
            .uniButtonStyle(.plain)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(
            Capsule()
                .fill(Color(UIColor.secondarySystemBackground))
                .shadow(color: .black.opacity(0.08), radius: 4, x: 0, y: 1)
        )
        .overlay(
            Capsule()
                .strokeBorder(Color.accentColor.opacity(0.4), lineWidth: 1)
        )
        .animation(.easeInOut(duration: 0.2), value: isTextFieldFocused)
        .onChange(of: isTextFieldFocused) { focused in
            if !focused {
                viewModel.syncAddressBar()
            }
        }
    }

    // MARK: - Reload / Stop

    @ViewBuilder
    private var reloadOrStopButton: some View {
        if let activeTab = viewModel.activeTab {
            switch activeTab.pageState {
            case .loading:
                UniButton(action: { activeTab.stopLoading() }) {
                    Image(systemName: "xmark")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.secondary)
                }
                .uniButtonStyle(.plain)
            case .loaded:
                UniButton(action: { activeTab.reload() }) {
                    Image(systemName: "arrow.clockwise")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.secondary)
                }
                .uniButtonStyle(.plain)
            default:
                EmptyView()
            }
        }
    }

    // MARK: - Helpers

    private var displayText: String {
        guard let url = viewModel.activeTab?.currentURL else {
            return "Tìm hoặc nhập tên web"
        }
        return url.host ?? url.absoluteString
    }

    private var isSecureURL: Bool {
        viewModel.activeTab?.currentURL?.scheme?.lowercased() == "https"
    }
}
