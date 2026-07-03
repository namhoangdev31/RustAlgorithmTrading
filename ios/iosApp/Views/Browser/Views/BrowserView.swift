import ExploreSwiftUI
import SwiftUI

public struct BrowserView: View {
    @ObservedObject var viewModel: BrowserViewModel
    @Environment(\.dismiss) private var dismiss
    
    public init(viewModel: BrowserViewModel) {
        self.viewModel = viewModel
    }
    
    public var body: some View {
        VStack(spacing: 0) {
            // Header: Address Bar
            HStack {
                UniButton(action: {
                    dismiss()
                }) {
                    Image(systemName: "chevron.down")
                        .font(.title3)
                        .padding(.leading)
                }
                .uniButtonStyle(.plain)
                
                BrowserAddressBar(viewModel: viewModel)
            }
            .padding(.vertical, 8)
            .background(Color.leposBackground)
            
            // Progress Bar
            if let progress = loadingProgress {
                ProgressView(value: progress, total: 1.0)
                    .progressViewStyle(LinearProgressViewStyle(tint: .blue))
                    .frame(height: 2)
            } else {
                Spacer().frame(height: 2)
            }
            
            // Content: Web View or Error View
            ZStack {
                if let activeTab = viewModel.activeTab {
                    if case .failed(let error) = activeTab.pageState {
                        BrowserErrorView(error: error) {
                            activeTab.reload()
                        } onOpenInExternalBrowser: {
                            if let url = activeTab.currentURL {
                                UIApplication.shared.open(url, options: [:], completionHandler: nil)
                            }
                        }
                    } else {
                        BrowserWebView(tabViewModel: activeTab)
                            .id(activeTab.id) // Force redraw when switching active tabs
                    }
                } else {
                    Text("Không có tab nào đang mở.")
                        .uniForegroundStyle(.gray)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            
            Divider()
            
            // Footer: Toolbar
            BrowserToolbarView(viewModel: viewModel)
                .background(Color.leposBackground)
        }
        .navigationBarHidden(true)
        .sheet(isPresented: $viewModel.showTabSwitcher) {
            BrowserTabSwitcherView(viewModel: viewModel)
        }
        .sheet(isPresented: $viewModel.showBookmarksList) {
            BrowserBookmarksView(viewModel: viewModel)
        }
        .sheet(isPresented: $viewModel.showHistoryList) {
            BrowserHistoryView(viewModel: viewModel)
        }
    }
    
    private var loadingProgress: Double? {
        guard let activeTab = viewModel.activeTab else { return nil }
        if case .loading(let progress) = activeTab.pageState {
            return progress
        }
        return nil
    }
}
