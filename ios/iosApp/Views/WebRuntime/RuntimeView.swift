import ExploreSwiftUI
import SwiftUI

struct RuntimeView: View {
    let manifest: WebRuntimeManifest
    let bundlePath: URL
    @ObservedObject var viewModel: WebRuntimeViewModel

    @ObservedObject private var recordingState = RecordingStateManager.shared
    @State private var isExpanded = false
    @State private var dragPosition: CGPoint?
    #if DEBUG
    @State private var isShowingDiagnostics = false
    #endif
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ZStack {
            contentView
            
            // Native Sensor Recording Indicator Banner
            VStack {
                if recordingState.isMicrophoneActive || recordingState.isCameraActive {
                    HStack(spacing: 8) {
                        Circle()
                            .fill(Color.red)
                            .frame(width: 8, height: 8)
                        Text(recordingState.isMicrophoneActive ? "Mini App [\(manifest.name)] đang sử dụng Microphone..." : "Mini App [\(manifest.name)] đang sử dụng Camera...")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(.white)
                        Spacer()
                        Button(action: {
                            recordingState.stopAll()
                        }) {
                            Text("Dừng")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundColor(.white)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Color.red)
                                .cornerRadius(4)
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(Color.black.opacity(0.85))
                    .cornerRadius(8)
                    .padding(.top, 16)
                    .transition(.move(edge: .top).combined(with: .opacity))
                }
                Spacer()
            }
            .padding(.horizontal, 16)
            .animation(.spring(), value: recordingState.isMicrophoneActive || recordingState.isCameraActive)
            
            assistiveTouchButton
        }
        .onAppear {
            viewModel.openBundle(manifest: manifest, bundlePath: bundlePath)
        }
        .onDisappear {
            viewModel.stopAll()
        }
        .supportedOrientations(orientationMask)
        .onChange(of: viewModel.activeTabId) { newId in
            if let newId = newId {
                viewModel.activateTab(id: newId)
            }
        }
        .fullScreenCover(isPresented: $viewModel.showTabSwitcher) {
            TabSwitcher(
                tabs: $viewModel.tabs,
                selectedTabId: $viewModel.activeTabId,
                isPresented: $viewModel.showTabSwitcher,
                onAddTab: {
                    viewModel.openBundle(manifest: manifest, bundlePath: bundlePath)
                },
                onCloseTab: { tabId in
                    viewModel.closeTab(id: tabId)
                }
            )
        }
        #if DEBUG
        .sheet(isPresented: $isShowingDiagnostics) {
            RuntimeDiagnosticsView(snapshot: viewModel.diagnosticsSnapshot())
        }
        #endif
    }

    @ViewBuilder
    private var contentView: some View {
        if let runtimeError = viewModel.runtimeError {
            RuntimeErrorBoundaryView(error: runtimeError) { action in
                handleRuntimeAction(action)
            }
        } else if let activeId = viewModel.activeTabId, let activeTab = viewModel.tabs.first(where: { $0.id == activeId }) {
            ZStack {
                if activeTab.status == .loading {
                    UniProgressView()
                        .uniForegroundStyle(.white)
                        .scaleEffect(1.5)
                } else if let webView = activeTab.webView {
                    RuntimeWebViewWrapper(webView: webView)
                } else {
                    VStack {
                        UniProgressView()
                        Text("Recreating tab state...")
                            .font(.caption)
                            .foregroundColor(.gray)
                    }
                }
            }
        } else if let error = viewModel.errorMsg {
            RuntimeErrorBoundaryView(
                error: .serverFailed(error),
                onAction: handleRuntimeAction
            )
        } else {
            UniProgressView()
                .uniForegroundStyle(.white)
                .scaleEffect(1.5)
        }
    }

    private func handleRuntimeAction(_ action: RuntimeShellAction) {
        switch action {
        case .retry:
            viewModel.performRuntimeAction(action, manifest: manifest, bundlePath: bundlePath)
        case .rollback:
            viewModel.performRuntimeAction(action, manifest: manifest, bundlePath: bundlePath)
        case .clearData:
            viewModel.performRuntimeAction(action, manifest: manifest, bundlePath: bundlePath)
        case .report:
            viewModel.performRuntimeAction(action, manifest: manifest, bundlePath: bundlePath)
        case .close:
            dismiss()
        }
    }

    @ViewBuilder
    private var assistiveTouchButton: some View {
        GeometryReader { geometry in
            ZStack {
                if isExpanded {
                    Color.black.opacity(0.001)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .onTapGesture {
                            withAnimation { isExpanded = false }
                        }

                    VStack(spacing: 20) {
                        UniButton(action: {
                            NotificationCenter.default.post(
                                name: NSNotification.Name("ReloadMiniApp"), object: nil)
                            withAnimation { isExpanded = false }
                        }) {
                            Image(systemName: "arrow.clockwise")
                                .font(.title)
                                .uniForegroundStyle(.primary)
                                .frame(width: 50, height: 50)
                                .uniGlass(cornerRadius: 25)
                        }
                        .uniButtonStyle(.plain)

                        UniButton(action: {
                            if let activeId = viewModel.activeTabId,
                               let activeTab = viewModel.tabs.first(where: { $0.id == activeId }) {
                                Task {
                                    if let img = await activeTab.webView?.takeSnapshot() {
                                        activeTab.snapshot = img
                                    }
                                    withAnimation {
                                        viewModel.showTabSwitcher = true
                                        isExpanded = false
                                    }
                                }
                            } else {
                                withAnimation {
                                    viewModel.showTabSwitcher = true
                                    isExpanded = false
                                }
                            }
                        }) {
                            Image(systemName: "square.grid.2x2")
                                .font(.title)
                                .uniForegroundStyle(.primary)
                                .frame(width: 50, height: 50)
                                .uniGlass(cornerRadius: 25)
                        }
                        .uniButtonStyle(.plain)

                        #if DEBUG
                        UniButton(action: {
                            isShowingDiagnostics = true
                            withAnimation { isExpanded = false }
                        }) {
                            Image(systemName: "stethoscope")
                                .font(.title)
                                .uniForegroundStyle(.primary)
                                .frame(width: 50, height: 50)
                                .uniGlass(cornerRadius: 25)
                        }
                        .uniButtonStyle(.plain)
                        #endif

                        UniButton(action: {
                            dismiss()
                            withAnimation { isExpanded = false }
                        }) {
                            Image(systemName: "xmark")
                                .font(.title)
                                .uniForegroundStyle(.primary)
                                .frame(width: 50, height: 50)
                                .uniGlass(cornerRadius: 25)
                        }
                        .uniButtonStyle(.plain)
                    }
                    .padding()
                    .uniGlass(cornerRadius: 16)
                    .position(x: geometry.size.width / 2, y: geometry.size.height / 2)
                    .transition(.scale)
                    .zIndex(2)
                }

                if !isExpanded {
                    UniButton(action: {
                        withAnimation { isExpanded.toggle() }
                    }) {
                        Image(systemName: "circle.grid.3x3.fill")
                            .font(.system(size: 24))
                            .uniForegroundStyle(.primary)
                            .frame(width: 60, height: 60)
                    }
                    .uniButtonStyle(.plain)
                    .uniGlass(cornerRadius: 100)
                    .position(
                        dragPosition
                            ?? CGPoint(x: geometry.size.width - 50, y: geometry.size.height - 150)
                    )
                    .highPriorityGesture(
                        DragGesture()
                            .onChanged { gesture in
                                dragPosition = gesture.location
                            }
                            .onEnded { value in
                                var currentPosition = value.location
                                currentPosition.x =
                                    currentPosition.x > (geometry.size.width / 2)
                                    ? geometry.size.width - 40 : 40
                                let minY: CGFloat = 80
                                let maxY: CGFloat = geometry.size.height - 80
                                currentPosition.y = min(max(currentPosition.y, minY), maxY)
                                withAnimation(.spring(response: 0.5, dampingFraction: 0.7)) {
                                    dragPosition = currentPosition
                                }
                            }
                    )
                    .zIndex(1)
                }
            }
        }
    }

    private var orientationMask: UIInterfaceOrientationMask {
        switch manifest.orientation.lowercased() {
        case "landscape": return .landscape
        case "portrait": return .portrait
        default: return .all
        }
    }
}

private struct RuntimeWebViewWrapper: UIViewRepresentable {
    let webView: RuntimeWebView

    func makeUIView(context: Context) -> RuntimeWebView {
        NotificationCenter.default.addObserver(
            forName: NSNotification.Name("ReloadMiniApp"),
            object: nil,
            queue: .main
        ) { _ in
            webView.reload()
        }

        return webView
    }

    func updateUIView(_ uiView: RuntimeWebView, context: Context) {}
}

extension View {
    fileprivate func supportedOrientations(_ mask: UIInterfaceOrientationMask) -> some View {
        self.onAppear {
            guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene
            else { return }
            if #available(iOS 16.0, *) {
                windowScene.requestGeometryUpdate(.iOS(interfaceOrientations: mask))
            }
        }
    }
}
