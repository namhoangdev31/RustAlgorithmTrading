import SwiftUI

struct BrowserPageSettingsMenuView: View {
    @ObservedObject var viewModel: BrowserViewModel
    @ObservedObject var activeTab: BrowserTabViewModel
    @Binding var showExtensionsAlert: Bool
    @EnvironmentObject var navigation: NavigationViewModel
    
    var body: some View {
        Menu {
            Button(action: {
                navigation.navigate(to: .browserSearch(isPrivate: viewModel.isPrivateMode))
            }) {
                Label("Tìm kiếm hoặc nhập địa chỉ", systemImage: "magnifyingglass")
            }
            
            Divider()
            
            Button(action: {
                activeTab.hideDistractingItems()
            }) {
                Label("Ẩn các mục gây sao lãng", systemImage: "eye.slash")
            }
            
            Button(action: {
                activeTab.copyPageDiagnostics()
                viewModel.lastPageActionMessage = "Đã sao chép thông tin trang để báo cáo sự cố."
            }) {
                Label("Báo cáo sự cố trang web", systemImage: "exclamationmark.bubble")
            }
            
            Button(action: {
                activeTab.translatePage()
            }) {
                Label("Dịch trang web...", systemImage: "character.book.closed")
            }
            
            Button(action: {
                showExtensionsAlert = true
            }) {
                Label("Quản lý phần mở rộng", systemImage: "puzzlepiece")
            }
            
            Divider()
            
            Button(action: {
                viewModel.showFindInPage = true
            }) {
                Label("Tìm kiếm trong trang", systemImage: "doc.text.magnifyingglass")
            }
            
            Menu("Cỡ chữ (\(activeTab.textZoomLevel)%)") {
                Button("Tăng kích cỡ") {
                    activeTab.adjustTextZoom(by: 10)
                }
                Button("Giảm kích cỡ") {
                    activeTab.adjustTextZoom(by: -10)
                }
            }
            
            Toggle(isOn: $viewModel.isAdBlockEnabled) {
                Label("Chặn quảng cáo & Popups", systemImage: "shield.fill")
            }
            
            Button(action: {
                viewModel.showPageDetailsMenu = true
            }) {
                Label("Cài đặt khác...", systemImage: "ellipsis")
            }
        } label: {
            Image(systemName: "ellipsis.circle")
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(.secondary)
                .frame(width: 28, height: 36)
            .contentShape(Rectangle())
        }
        .menuStyle(.button)
    }
}
