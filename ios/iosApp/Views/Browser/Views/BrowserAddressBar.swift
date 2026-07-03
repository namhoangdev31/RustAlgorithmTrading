import ExploreSwiftUI
import SwiftUI

public struct BrowserAddressBar: View {
    @ObservedObject var viewModel: BrowserViewModel
    @FocusState private var isTextFieldFocused: Bool
    
    public init(viewModel: BrowserViewModel) {
        self.viewModel = viewModel
    }
    
    public var body: some View {
        HStack(spacing: 8) {
            // Secure connection icon
            Image(systemName: isSecureURL ? "lock.fill" : "lock.slash.fill")
                .uniForegroundStyle(isSecureURL ? .green : .gray)
                .font(.system(size: 14))
                .padding(.leading, 8)
            
            // URL Textfield
            TextField("Tìm kiếm hoặc nhập địa chỉ URL", text: $viewModel.urlInputText)
                .keyboardType(.URL)
                .autocapitalization(.none)
                .disableAutocorrection(true)
                .focused($isTextFieldFocused)
                .onSubmit {
                    viewModel.loadURLString(viewModel.urlInputText)
                }
                .font(.system(size: 15))
            
            // Clear or Reload/Stop button
            if isTextFieldFocused && !viewModel.urlInputText.isEmpty {
                UniButton(action: {
                    viewModel.urlInputText = ""
                }) {
                    Image(systemName: "xmark.circle.fill")
                        .uniForegroundStyle(.gray)
                        .font(.system(size: 16))
                }
                .uniButtonStyle(.plain)
            } else {
                if let activeTab = viewModel.activeTab {
                    switch activeTab.pageState {
                    case .loading:
                        UniButton(action: {
                            activeTab.stopLoading()
                        }) {
                            Image(systemName: "xmark")
                                .uniForegroundStyle(.primary)
                                .font(.system(size: 15, weight: .bold))
                        }
                        .uniButtonStyle(.plain)
                    default:
                        UniButton(action: {
                            activeTab.reload()
                        }) {
                            Image(systemName: "arrow.clockwise")
                                .uniForegroundStyle(.primary)
                                .font(.system(size: 15, weight: .bold))
                        }
                        .uniButtonStyle(.plain)
                    }
                }
            }
        }
        .padding(.vertical, 8)
        .padding(.horizontal, 6)
        .background(Color.leposBackground.opacity(0.8))
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(Color.gray.opacity(0.3), lineWidth: 0.5)
        )
        .padding(.horizontal)
        .onChange(of: isTextFieldFocused) { focused in
            if focused {
                // Select all or clear if needed
            } else {
                viewModel.syncAddressBar()
            }
        }
    }
    
    private var isSecureURL: Bool {
        guard let url = viewModel.activeTab?.currentURL else { return true }
        return url.scheme?.lowercased() == "https"
    }
}
