import ExploreSwiftUI
import SwiftUI

struct RuntimeView: View {
    let manifest: WebRuntimeManifest
    let bundlePath: URL
    @ObservedObject var viewModel: WebRuntimeViewModel

    @State private var isExpanded = false
    @State private var dragPosition: CGPoint?
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ZStack {
            contentView
            assistiveTouchButton
        }
        .onAppear {
            viewModel.loadBundle(manifest: manifest, bundlePath: bundlePath)
        }
        .onDisappear {
            viewModel.stopServer()
        }
        .supportedOrientations(orientationMask)
    }

    @ViewBuilder
    private var contentView: some View {
        switch viewModel.state {
        case .idle:
            EmptyView()
        case .loading:
            UniProgressView()
                .uniForegroundStyle(.white)
                .scaleEffect(1.5)
        case .ready(let entryUrl):
            RuntimeWebViewWrapper(manifest: manifest, httpUrl: entryUrl)
        case .error(let message):
            VStack(spacing: 16) {
                Image(systemName: "exclamationmark.triangle.fill")
                    .font(.system(size: 60))
                    .uniForegroundStyle(.red)
                Text("Error")
                    .font(.title)
                    .uniForegroundStyle(.white)
                Text(message)
                    .font(.body)
                    .uniForegroundStyle(.white, opacity: 0.8)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }
        }
    }

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
    let manifest: WebRuntimeManifest
    let httpUrl: String

    func makeUIView(context: Context) -> RuntimeWebView {
        let webView = RuntimeWebView(frame: .zero, manifest: manifest)
        webView.loadBundle(httpUrl: httpUrl)

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
