import SwiftUI

struct BrowserPageDetailsMenuView: View {
    @ObservedObject var viewModel: BrowserViewModel
    @ObservedObject var activeTab: BrowserTabViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var showPrivacyReport = false
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Tác vụ trang")) {
                    Button(action: {
                        showPrivacyReport = true
                    }) {
                        HStack {
                            Label("Báo cáo quyền riêng tư", systemImage: "shield.checkered")
                            Spacer()
                            Text("Ngăn chặn theo dõi")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                    
                    Button(action: {
                        dismiss()
                        withAnimation {
                            viewModel.isToolbarCollapsed = true
                        }
                    }) {
                        Label("Ẩn thanh công cụ", systemImage: "arrow.up.left.and.arrow.down.right")
                    }
                    
                    Button(action: {
                        dismiss()
                        activeTab.toggleDesktopSite()
                    }) {
                        HStack {
                            Label("Yêu cầu trang web cho máy tính", systemImage: "desktopcomputer")
                            Spacer()
                            if activeTab.isDesktopSite {
                                Image(systemName: "checkmark")
                                    .foregroundColor(.blue)
                            }
                        }
                    }
                    
                    Button(action: {
                        dismiss()
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
                            if !activeTab.printPage() {
                                viewModel.lastPageActionMessage = "Không thể mở giao diện in trên simulator này."
                            }
                        }
                    }) {
                        Label("In", systemImage: "printer")
                    }
                }
                
                Section(header: Text("Tác vụ tab")) {
                    Button(action: {
                        dismiss()
                        if let url = activeTab.currentURL {
                            viewModel.persistenceStore.addBookmark(url: url.absoluteString, title: activeTab.title)
                            viewModel.lastPageActionMessage = "Đã thêm vào Dấu trang."
                        }
                    }) {
                        Label("Thêm dấu trang", systemImage: "book")
                    }
                    
                    Button(action: {
                        dismiss()
                        if let url = activeTab.currentURL {
                            viewModel.persistenceStore.addBookmark(url: url.absoluteString, title: activeTab.title)
                            viewModel.lastPageActionMessage = "Đã thêm vào Mục ưa thích."
                        }
                    }) {
                        Label("Thêm vào Mục ưa thích", systemImage: "star")
                    }
                }

                Section {
                    Button(role: .destructive) {
                        dismiss()
                        viewModel.clearWebsiteData()
                    } label: {
                        Label("Xóa lịch sử và dữ liệu trang web", systemImage: "trash")
                    }
                }
                
                Section(header: Text("Cài đặt trang web cho \(activeTab.currentURL?.host ?? "trang web")")) {
                    Toggle("Yêu cầu trang web cho máy tính", isOn: Binding(
                        get: { activeTab.isDesktopSite },
                        set: { _ in activeTab.toggleDesktopSite() }
                    ))
                    
                    HStack {
                        Text("Camera")
                        Spacer()
                        Text("Hỏi")
                            .foregroundColor(.secondary)
                    }
                    
                    HStack {
                        Text("Micrô")
                        Spacer()
                        Text("Hỏi")
                            .foregroundColor(.secondary)
                    }
                }
            }
            .navigationTitle("Menu của trang")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(action: { dismiss() }) {
                        Image(systemName: "xmark")
                            .foregroundColor(.secondary)
                            .font(.title2)
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Sửa") {
                    }
                    .font(.system(size: 16, weight: .bold))
                }
            }
        }
        .alert("Báo cáo quyền riêng tư", isPresented: $showPrivacyReport) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(activeTab.privacySummary)
        }
    }
}
