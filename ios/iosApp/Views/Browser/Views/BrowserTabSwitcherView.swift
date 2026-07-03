import ExploreSwiftUI
import SwiftUI

public struct BrowserTabSwitcherView: View {
    @ObservedObject var viewModel: BrowserViewModel
    @Environment(\.dismiss) private var dismiss
    
    public init(viewModel: BrowserViewModel) {
        self.viewModel = viewModel
    }
    
    public var body: some View {
        NavigationView {
            VStack {
                UniScrollView {
                    LazyVGrid(columns: [GridItem(.flexible(), spacing: 16), GridItem(.flexible(), spacing: 16)], spacing: 16) {
                        ForEach(viewModel.tabs) { tabVM in
                            TabGridItem(tabVM: tabVM, isActive: tabVM.id == viewModel.activeTabId) {
                                viewModel.switchTab(to: tabVM.id)
                                dismiss()
                            } onClose: {
                                viewModel.closeTab(id: tabVM.id)
                            }
                        }
                    }
                    .padding()
                }
                
                // Bottom control panel inside sheet
                HStack {
                    UniButton(action: {
                        viewModel.isPrivateMode.toggle()
                        // Recreate active tab in the new mode if needed, or let user create one
                    }) {
                        HStack {
                            Image(systemName: viewModel.isPrivateMode ? "hand.raised.fill" : "hand.raised")
                            Text(viewModel.isPrivateMode ? "Chế độ Riêng tư: Bật" : "Chế độ Riêng tư")
                        }
                        .foregroundColor(viewModel.isPrivateMode ? .purple : .primary)
                    }
                    .uniButtonStyle(.plain)
                    
                    Spacer()
                    
                    UniButton(action: {
                        viewModel.createNewTab()
                        dismiss()
                    }) {
                        Image(systemName: "plus")
                            .font(.title2)
                            .padding(8)
                            .background(Color.blue)
                            .foregroundColor(.white)
                            .clipShape(Circle())
                    }
                    .uniButtonStyle(.plain)
                }
                .padding()
                .background(Color(.systemGray6))
            }
            .navigationTitle("Danh sách Tab")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    UniButton(action: {
                        dismiss()
                    }) {
                        Text("Xong")
                    }
                    .uniButtonStyle(.plain)
                }
            }
        }
    }
}

struct TabGridItem: View {
    @ObservedObject var tabVM: BrowserTabViewModel
    let isActive: Bool
    let onTap: () -> Void
    let onClose: () -> Void
    
    var body: some View {
        VStack(alignment: .leading) {
            HStack {
                Text(tabVM.title)
                    .font(.caption)
                    .lineLimit(1)
                    .foregroundColor(isActive ? .blue : .primary)
                
                Spacer()
                
                UniButton(action: onClose) {
                    Image(systemName: "xmark")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.gray)
                        .padding(4)
                        .background(Color(.systemGray5))
                        .clipShape(Circle())
                }
                .uniButtonStyle(.plain)
            }
            .padding(.horizontal, 8)
            .padding(.top, 6)
            
            Spacer()
            
            // Thumbnail or Placeholder representing URL
            VStack {
                Image(systemName: tabVM.isPrivate ? "hand.raised.fill" : "globe")
                    .font(.largeTitle)
                    .foregroundColor(.gray.opacity(0.6))
                
                Text(tabVM.currentURL?.host ?? "Trang trống")
                    .font(.system(size: 10))
                    .foregroundColor(.gray)
                    .lineLimit(1)
                    .padding(.horizontal, 4)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            
            Spacer()
        }
        .frame(height: 120)
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(isActive ? Color.blue : Color.gray.opacity(0.3), lineWidth: isActive ? 2 : 1)
        )
        .contentShape(Rectangle())
        .onTapGesture {
            onTap()
        }
    }
}
