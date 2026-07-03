import ExploreSwiftUI
import SwiftUI

public struct BrowserToolbarView: View {
    @ObservedObject var viewModel: BrowserViewModel
    @State private var isShowingShareSheet = false
    
    public init(viewModel: BrowserViewModel) {
        self.viewModel = viewModel
    }
    
    public var body: some View {
        HStack {
            // Back Button
            UniButton(action: {
                viewModel.activeTab?.goBack()
            }) {
                Image(systemName: "chevron.backward")
                    .font(.title3)
                    .foregroundColor(canGoBack ? .primary : .gray.opacity(0.4))
            }
            .uniButtonStyle(.plain)
            .disabled(!canGoBack)
            
            Spacer()
            
            // Forward Button
            UniButton(action: {
                viewModel.activeTab?.goForward()
            }) {
                Image(systemName: "chevron.forward")
                    .font(.title3)
                    .foregroundColor(canGoForward ? .primary : .gray.opacity(0.4))
            }
            .uniButtonStyle(.plain)
            .disabled(!canGoForward)
            
            Spacer()
            
            // Share Button
            UniButton(action: {
                isShowingShareSheet = true
            }) {
                Image(systemName: "square.and.arrow.up")
                    .font(.title3)
            }
            .uniButtonStyle(.plain)
            .disabled(viewModel.activeTab?.currentURL == nil)
            
            Spacer()
            
            // Bookmark Action
            Menu {
                Button(action: {
                    viewModel.addCurrentToBookmarks()
                }) {
                    Label("Thêm dấu trang", systemImage: "bookmark")
                }
                
                Button(action: {
                    viewModel.showBookmarksList = true
                }) {
                    Label("Danh sách dấu trang", systemImage: "book")
                }
                
                Button(action: {
                    viewModel.showHistoryList = true
                }) {
                    Label("Lịch sử duyệt web", systemImage: "clock")
                }
            } label: {
                Image(systemName: "book")
                    .font(.title3)
            }
            
            Spacer()
            
            // Tab Switcher Button
            UniButton(action: {
                viewModel.showTabSwitcher = true
            }) {
                ZStack {
                    Image(systemName: "square.on.square")
                        .font(.title3)
                    
                    Text("\(viewModel.tabs.count)")
                        .font(.system(size: 10, weight: .bold))
                        .offset(x: 1, y: 1)
                }
            }
            .uniButtonStyle(.plain)
        }
        .padding(.horizontal, 24)
        .padding(.vertical, 12)
        .background(Color(.systemBackground))
        .sheet(isPresented: $isShowingShareSheet) {
            if let activeTab = viewModel.activeTab, let url = activeTab.currentURL {
                BrowserShareSheet(url: url, title: activeTab.title)
            }
        }
    }
    
    private var canGoBack: Bool {
        viewModel.activeTab?.canGoBack ?? false
    }
    
    private var canGoForward: Bool {
        viewModel.activeTab?.canGoForward ?? false
    }
}
