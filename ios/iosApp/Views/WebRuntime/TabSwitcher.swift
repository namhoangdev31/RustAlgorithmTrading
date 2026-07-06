import SwiftUI
import WebKit

struct TabSwitcher: View {
    @Binding var tabs: [WebTab]
    @Binding var selectedTabId: UUID?
    @Binding var isPresented: Bool

    var onAddTab: (() -> Void)?
    var onCloseTab: ((UUID) -> Void)?

    @State private var searchText = ""

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                header
                searchField
                tabGrid
            }
            .background(Color(red: 0.06, green: 0.06, blue: 0.08).ignoresSafeArea())
            .safeAreaInset(edge: .bottom) {
                bottomToolbar
            }
            .navigationBarHidden(true)
        }
        .preferredColorScheme(.dark)
    }

    private var header: some View {
        HStack {
            Text("Tabs")
                .font(.title3.weight(.semibold))
                .foregroundStyle(.white)

            Spacer()

            Button {
                dismiss()
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(width: 34, height: 34)
                    .background(Circle().fill(Color.white.opacity(0.12)))
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 18)
        .padding(.top, 14)
        .padding(.bottom, 10)
    }

    private var searchField: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass")
                .foregroundStyle(.white.opacity(0.55))

            TextField("Search Tabs or Web Addresses", text: $searchText)
                .foregroundStyle(.white)
                .textInputAutocapitalization(.never)
                .disableAutocorrection(true)

            if !searchText.isEmpty {
                Button {
                    searchText = ""
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(.white.opacity(0.55))
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 12)
        .frame(height: 42)
        .background(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(Color.white.opacity(0.09))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
        .padding(.horizontal, 18)
        .padding(.bottom, 12)
    }

    private var tabGrid: some View {
        ScrollView {
            LazyVGrid(columns: columns, spacing: 16) {
                ForEach(filteredTabs) { tab in
                    RuntimeTabCard(
                        tab: tab,
                        isSelected: tab.id == selectedTabId,
                        onSelect: { select(tab) },
                        onClose: { close(tab) }
                    )
                }
            }
            .padding(.horizontal, 18)
            .padding(.bottom, 96)

            if filteredTabs.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "rectangle.on.rectangle.slash")
                        .font(.system(size: 34))
                    Text("No matching tabs")
                        .font(.subheadline.weight(.medium))
                }
                .foregroundStyle(.white.opacity(0.5))
                .frame(maxWidth: .infinity)
                .padding(.top, 80)
            }
        }
    }

    private var bottomToolbar: some View {
        HStack {
            Button {
                addNewTab()
            } label: {
                Image(systemName: "plus")
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundStyle(.blue)
                    .frame(width: 44, height: 44)
            }
            .buttonStyle(.plain)

            Spacer()

            Text(tabs.count == 1 ? "1 Tab" : "\(tabs.count) Tabs")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(.white.opacity(0.75))

            Spacer()

            Button("Done") {
                dismiss()
            }
            .font(.system(size: 16, weight: .bold))
            .foregroundStyle(.blue)
            .frame(width: 70, height: 44)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
        .background(Color(red: 0.06, green: 0.06, blue: 0.08).opacity(0.96))
    }

    private var columns: [GridItem] {
        [
            GridItem(.flexible(), spacing: 14),
            GridItem(.flexible(), spacing: 14)
        ]
    }

    private var filteredTabs: [WebTab] {
        let query = searchText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !query.isEmpty else { return tabs }
        return tabs.filter { tab in
            tab.title.localizedCaseInsensitiveContains(query)
                || (tab.url?.absoluteString.localizedCaseInsensitiveContains(query) ?? false)
                || (tab.url?.host?.localizedCaseInsensitiveContains(query) ?? false)
        }
    }

    private func addNewTab() {
        if let onAddTab {
            onAddTab()
        } else {
            let tab = WebTab(
                manifest: WebRuntimeManifest(
                    id: "new_tab",
                    version: "1.0",
                    name: "New Tab",
                    entry: "index.html",
                    type: "spa",
                    orientation: "automatic",
                    fullScreen: false
                ),
                bundlePath: URL(fileURLWithPath: ""),
                server: iOSWebServer(basePath: "")
            )
            tabs.append(tab)
            selectedTabId = tab.id
        }
        dismiss()
    }

    private func select(_ tab: WebTab) {
        selectedTabId = tab.id
        dismiss()
    }

    private func close(_ tab: WebTab) {
        if let onCloseTab {
            onCloseTab(tab.id)
            return
        }

        guard let index = tabs.firstIndex(where: { $0.id == tab.id }) else { return }
        tabs.remove(at: index)
        if selectedTabId == tab.id {
            selectedTabId = tabs.isEmpty ? nil : tabs[min(index, tabs.count - 1)].id
        }
    }

    private func dismiss() {
        withAnimation(.easeInOut(duration: 0.18)) {
            isPresented = false
        }
    }
}

private struct RuntimeTabCard: View {
    @ObservedObject var tab: WebTab
    let isSelected: Bool
    let onSelect: () -> Void
    let onClose: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 8) {
                Image(systemName: "globe")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(.blue)
                    .frame(width: 22, height: 22)
                    .background(Circle().fill(Color.blue.opacity(0.16)))

                Text(tab.title)
                    .font(.system(size: 12, weight: .semibold))
                    .lineLimit(1)
                    .foregroundStyle(.white)

                Spacer(minLength: 0)

                Button(action: onClose) {
                    Image(systemName: "xmark")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(.white.opacity(0.7))
                        .frame(width: 24, height: 24)
                        .background(Circle().fill(Color.white.opacity(0.12)))
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 9)
            .background(Color.white.opacity(0.06))

            ZStack {
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .fill(Color.white.opacity(0.08))

                VStack(spacing: 8) {
                    Image(systemName: statusIcon)
                        .font(.system(size: 30, weight: .regular))
                        .foregroundStyle(.white.opacity(0.38))

                    Text(tab.url?.host ?? "Local Runtime")
                        .font(.system(size: 10, weight: .medium))
                        .foregroundStyle(.white.opacity(0.48))
                        .lineLimit(1)
                        .padding(.horizontal, 8)
                }
            }
            .frame(height: 136)
            .padding(8)
        }
        .background(Color.white.opacity(0.05))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(isSelected ? Color.blue : Color.white.opacity(0.12), lineWidth: isSelected ? 2 : 1)
        )
        .contentShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .onTapGesture(perform: onSelect)
    }

    private var statusIcon: String {
        switch tab.status {
        case .loading: return "hourglass"
        case .active: return "play.circle"
        case .paused: return "pause.circle"
        case .suspended: return "moon"
        case .closing, .closed: return "xmark.circle"
        }
    }
}

@MainActor
extension WKWebView {
    func takeSnapshot() async -> UIImage? {
        guard window != nil, bounds.width >= 1, bounds.height >= 1 else {
            return nil
        }

        let configuration = WKSnapshotConfiguration()
        configuration.rect = bounds

        return await withCheckedContinuation { continuation in
            takeSnapshot(with: configuration) { image, error in
                #if DEBUG
                if let error {
                    print("[WKWebView+Snapshot] \(error.localizedDescription)")
                }
                #endif
                continuation.resume(returning: image)
            }
        }
    }
}
