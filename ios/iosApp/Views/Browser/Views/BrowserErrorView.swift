import ExploreSwiftUI
import SwiftUI

public struct BrowserErrorView: View {
    public let error: BrowserError
    public let onRetry: () -> Void
    public let onOpenInExternalBrowser: () -> Void
    
    public init(
        error: BrowserError,
        onRetry: @escaping () -> Void,
        onOpenInExternalBrowser: @escaping () -> Void
    ) {
        self.error = error
        self.onRetry = onRetry
        self.onOpenInExternalBrowser = onOpenInExternalBrowser
    }
    
    public var body: some View {
        VStack(spacing: 20) {
            Image(systemName: errorIconName)
                .font(.system(size: 64))
                .uniForegroundStyle(.red)
                .padding(.bottom, 10)
            
            Text("Không thể tải trang")
                .font(.title2)
                .fontWeight(.bold)
                .uniForegroundStyle(.primary)
            
            Text(error.localizedDescription)
                .font(.body)
                .uniForegroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
            
            VStack(spacing: 12) {
                UniButton(action: onRetry) {
                    HStack {
                        Image(systemName: "arrow.clockwise")
                        Text("Thử lại")
                    }
                    .font(.body.weight(.semibold))
                    .uniForegroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(Color.blue)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                }
                .uniButtonStyle(.plain)
                .padding(.horizontal, 48)
                
                UniButton(action: onOpenInExternalBrowser) {
                    HStack {
                        Image(systemName: "safari")
                        Text("Mở bằng Safari")
                    }
                    .uniForegroundStyle(.blue)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(Color.blue.opacity(0.1))
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                }
                .uniButtonStyle(.plain)
                .padding(.horizontal, 48)
            }
            .padding(.top, 10)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.leposBackground)
    }
    
    private var errorIconName: String {
        switch error {
        case .invalidURL:
            return "link.badge.plus"
        case .securityBlocked:
            return "shield.slash"
        case .webProcessCrashed:
            return "exclamationmark.triangle"
        default:
            return "wifi.slash"
        }
    }
}
