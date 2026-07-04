import ExploreSwiftUI
import SwiftUI

// MARK: - Safari-style Address Bar

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
        HStack(spacing: 8) {
            // Left icon (Lock / magnifying glass)
            Image(systemName: isSecureURL ? "lock.fill" : "magnifyingglass")
                .font(.system(size: 13, weight: .medium))
                .foregroundColor(.secondary)
                .frame(width: 16, height: 16)

            // Stable TextField to prevent focus resetting on view structural transitions
            TextField("Tìm hoặc nhập tên web", text: $editingText)
                .keyboardType(.webSearch)
                .autocapitalization(.none)
                .disableAutocorrection(true)
                .focused($isTextFieldFocused)
                .font(.system(size: 14.5))
                .submitLabel(.go)
                .onSubmit {
                    viewModel.loadURLString(editingText)
                    isTextFieldFocused = false
                }
                .opacity(isTextFieldFocused ? 1.0 : 0.0)
                .overlay(
                    // Overlay non-editable text when NOT focused to mimic Safari collapsed style
                    Group {
                        if !isTextFieldFocused {
                            HStack {
                                Text(displayText)
                                    .font(.system(size: 14.5))
                                    .foregroundColor(viewModel.activeTab?.currentURL == nil ? .secondary : .primary)
                                    .lineLimit(1)
                                    .truncationMode(.middle)
                                Spacer()
                            }
                            .contentShape(Rectangle())
                            .onTapGesture {
                                editingText = viewModel.activeTab?.currentURL?.absoluteString ?? ""
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
                        .font(.system(size: 14.5, weight: .medium))
                        .foregroundColor(.blue)
                }
                .uniButtonStyle(.plain)
            } else {
                reloadOrStopButton
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(
            Capsule()
                .fill(Color(UIColor.secondarySystemFill))
        )
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

    // MARK: - Reload / Stop

    @ViewBuilder
    private var reloadOrStopButton: some View {
        if let activeTab = viewModel.activeTab {
            switch activeTab.pageState {
            case .loading:
                UniButton(action: { activeTab.stopLoading() }) {
                    Image(systemName: "xmark")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(.secondary)
                }
                .uniButtonStyle(.plain)
            case .loaded:
                UniButton(action: { activeTab.reload() }) {
                    Image(systemName: "arrow.clockwise")
                        .font(.system(size: 12, weight: .semibold))
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
