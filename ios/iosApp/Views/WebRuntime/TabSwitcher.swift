import SwiftUI
import WebKit
import ExploreSwiftUI


/// A Safari-inspired Web Tab Switcher for the iOS app.
struct TabSwitcher: View {
    @Binding var tabs: [WebTab]
    @Binding var selectedTabId: UUID?
    @Binding var isPresented: Bool
    
    var onAddTab: (() -> Void)? = nil
    var onCloseTab: ((UUID) -> Void)? = nil
    
    @State private var searchText = ""
    @Namespace private var animationNamespace
    
    // Grid layout columns (2 columns like Safari on iOS)
    private let columns = [
        GridItem(.flexible(), spacing: 16),
        GridItem(.flexible(), spacing: 16)
    ]
    
    // Filtered tabs based on search text
    var filteredTabs: [WebTab] {
        if searchText.isEmpty {
            return tabs
        } else {
            return tabs.filter {
                $0.title.localizedCaseInsensitiveContains(searchText) ||
                ($0.url?.absoluteString.localizedCaseInsensitiveContains(searchText) ?? false)
            }
        }
    }
    
    var body: some View {
        NavigationView {
            ZStack {
                // Sleek dark-mode background with ambient radial glow
                Color(red: 0.05, green: 0.05, blue: 0.08)
                    .ignoresSafeArea()
                
                RadialGradient(
                    colors: [Color.blue.opacity(0.15), Color.clear],
                    center: .topTrailing,
                    startRadius: 100,
                    endRadius: 500
                )
                .ignoresSafeArea()
                
                VStack(spacing: 0) {
                    // Search Bar
                    SearchBarView(text: $searchText)
                        .padding(.horizontal)
                        .padding(.top, 10)
                        
                    // Scrollable Grid of Tabs
                    ScrollView {
                        LazyVGrid(columns: columns, spacing: 20) {
                            ForEach(filteredTabs) { tab in
                                TabCardView(
                                    tab: tab,
                                    isSelected: tab.id == selectedTabId,
                                    namespace: animationNamespace
                                ) {
                                    // Select tab
                                    selectedTabId = tab.id
                                    withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                                        isPresented = false
                                    }
                                } onClose: {
                                    closeTab(tab)
                                }
                            }
                        }
                        .padding()
                    }
                    
                    // Bottom Navigation Bar
                    BottomToolbarView(
                        tabCount: tabs.count,
                        onAddTab: {
                            addNewTab()
                        },
                        onDone: {
                            withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                                isPresented = false
                            }
                        }
                    )
                }
            }
            .navigationBarHidden(true)
        }
        .preferredColorScheme(.dark)
    }
    
    // Helper to add a new tab
    private func addNewTab() {
        if let onAddTab = onAddTab {
            onAddTab()
        } else {
            let newTab = WebTab(
                manifest: WebRuntimeManifest(id: "new_tab", version: "1.0", name: "New Tab", entry: "index.html", type: "spa", orientation: "automatic", fullScreen: false),
                bundlePath: URL(fileURLWithPath: ""),
                server: iOSWebServer(basePath: "")
            )
            tabs.append(newTab)
            selectedTabId = newTab.id
        }
        withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
            isPresented = false
        }
    }
    
    // Helper to close a tab
    private func closeTab(_ tab: WebTab) {
        if let onCloseTab = onCloseTab {
            onCloseTab(tab.id)
        } else {
            guard let index = tabs.firstIndex(where: { $0.id == tab.id }) else { return }
            withAnimation(.spring(response: 0.35, dampingFraction: 0.7)) {
                tabs.remove(at: index)
                
                // Adjust selection if the closed tab was selected
                if selectedTabId == tab.id {
                    if !tabs.isEmpty {
                        selectedTabId = tabs[min(index, tabs.count - 1)].id
                    } else {
                        selectedTabId = nil
                    }
                }
            }
        }
    }
}

// MARK: - Search Bar Component
struct SearchBarView: View {
    @Binding var text: String
    
    var body: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundColor(.secondary)
            
            TextField("Search Tabs or Web Addresses", text: $text)
                .foregroundColor(.primary)
                .disableAutocorrection(true)
                .textInputAutocapitalization(.never)
            
            if !text.isEmpty {
                Button(action: { text = "" }) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(Color.white.opacity(0.08))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.white.opacity(0.1), lineWidth: 1)
        )
    }
}

// MARK: - Tab Card View Component
struct TabCardView: View {
    let tab: WebTab
    let isSelected: Bool
    let namespace: Namespace.ID
    let onSelect: () -> Void
    let onClose: () -> Void
    
    @State private var dragOffset = CGSize.zero
    
    var body: some View {
        VStack(spacing: 0) {
            // Header Bar
            HStack {
                // Favicon Placeholder
                Image(systemName: "globe")
                    .font(.system(size: 11))
                    .foregroundColor(.blue)
                    .frame(width: 20, height: 20)
                    .background(Color.blue.opacity(0.15))
                    .clipShape(Circle())
                
                Text(tab.title)
                    .font(.system(size: 12, weight: .semibold))
                    .lineLimit(1)
                    .foregroundColor(.white)
                
                Spacer()
                
                // Close button
                Button(action: onClose) {
                    Image(systemName: "xmark")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.white.opacity(0.6))
                        .frame(width: 20, height: 20)
                        .background(Color.white.opacity(0.15))
                        .clipShape(Circle())
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 8)
            .background(Color.white.opacity(0.05))
            
            // Snapshot Preview area
            ZStack {
                if let snapshot = tab.cachedSnapshot {
                    Image(uiImage: snapshot)
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    // Modern placeholder layout
                    VStack(spacing: 8) {
                        Image(systemName: "safari")
                            .font(.system(size: 32, weight: .thin))
                            .foregroundColor(.white.opacity(0.3))
                        
                        Text(tab.url?.host ?? "Local Runtime")
                            .font(.system(size: 10))
                            .foregroundColor(.white.opacity(0.4))
                            .lineLimit(1)
                    }
                }
            }
            .frame(height: 140)
            .frame(maxWidth: .infinity)
            .background(Color(red: 0.1, green: 0.1, blue: 0.13))
            .clipped()
        }
        .cornerRadius(16)
        // Highlighting active tab with premium gradient border
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(
                    isSelected 
                    ? AnyShapeStyle(LinearGradient(colors: [.blue, .purple], startPoint: .topLeading, endPoint: .bottomTrailing))
                    : AnyShapeStyle(Color.white.opacity(0.15)),
                    lineWidth: isSelected ? 3 : 1
                )
        )
        .shadow(color: isSelected ? .blue.opacity(0.25) : .black.opacity(0.3), radius: isSelected ? 12 : 6, y: 4)
        .offset(x: dragOffset.width, y: dragOffset.height)
        .opacity(1.0 - Double(abs(dragOffset.width) / 200))
        // Swipe to close gesture (similar to Safari)
        .gesture(
            DragGesture()
                .onChanged { gesture in
                    // Only horizontal swipes close the tab in this grid
                    if gesture.translation.width < 0 {
                        dragOffset = gesture.translation
                    }
                }
                .onEnded { gesture in
                    if gesture.translation.width < -120 {
                        onClose()
                    } else {
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                            dragOffset = .zero
                        }
                    }
                }
        )
        .onTapGesture {
            onSelect()
        }
    }
}

// MARK: - Bottom Toolbar Component
struct BottomToolbarView: View {
    let tabCount: Int
    let onAddTab: () -> Void
    let onDone: () -> Void
    
    var body: some View {
        VStack(spacing: 0) {
            Divider()
                .background(Color.white.opacity(0.15))
            
            HStack {
                // Add Tab Button
                Button(action: onAddTab) {
                    Image(systemName: "plus")
                        .font(.title2)
                        .foregroundColor(.blue)
                        .frame(width: 44, height: 44)
                }
                .buttonStyle(.plain)
                
                Spacer()
                
                // Tab count title
                Text(tabCount == 1 ? "1 Tab" : "\(tabCount) Tabs")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(.white.opacity(0.8))
                
                Spacer()
                
                // Done Button
                Button(action: onDone) {
                    Text("Done")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.blue)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(Color(red: 0.05, green: 0.05, blue: 0.08).opacity(0.95))
        }
    }
}

// MARK: - WKWebView Snapshot helper Extension
extension WKWebView {
    /// Captures a UIImage snapshot of the WKWebView contents
    func takeSnapshot() async -> UIImage? {
        let configuration = WKSnapshotConfiguration()
        configuration.rect = self.bounds
        
        do {
            return try await withCheckedThrowingContinuation { continuation in
                self.takeSnapshot(with: configuration) { image, error in
                    if let error = error {
                        continuation.resume(throwing: error)
                    } else if let image = image {
                        continuation.resume(returning: image)
                    } else {
                        continuation.resume(returning: nil)
                    }
                }
            }
        } catch {
            print("[WKWebView+Snapshot] Error: \(error.localizedDescription)")
            return nil
        }
    }
}
