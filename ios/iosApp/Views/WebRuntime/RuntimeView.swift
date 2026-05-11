import SwiftUI
// import Shared — replaced by native Swift Shared module

@available(iOS 26.0 , *)
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
        .onDisappear {
            viewModel.stopServer()
        }
        .supportedOrientations(orientationMask)
    }

    @ViewBuilder
    private var contentView: some View {
        switch viewModel.state {
        case is WebRuntimeState.Idle:
            EmptyView()

        case is WebRuntimeState.Loading:
            ProgressView()
                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                .scaleEffect(1.5)

        case let ready as WebRuntimeState.Ready:
            RuntimeWebViewWrapper(
                manifest: manifest,
                httpUrl: ready.entryUrl
            )

        case let error as WebRuntimeState.Error:
            VStack(spacing: 16) {
                Image(systemName: "exclamationmark.triangle.fill")
                    .font(.system(size: 60))
                    .foregroundColor(.red)
                Text("Error")
                    .font(.title)
                    .foregroundColor(.white)
                Text(error.message)
                    .font(.body)
                    .foregroundColor(.white.opacity(0.8))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }

        default:
            EmptyView()
        }
    }

    private var assistiveTouchButton: some View {
        GeometryReader { geometry in
            ZStack {
                if isExpanded {
                    // Transparent background to capture taps outside the menu
                    Color.black.opacity(0.001)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .onTapGesture {
                            withAnimation {
                                isExpanded = false
                            }
                        }

                    VStack(spacing: 20) {
                        Button(action: {
                            // Reload Action
                            NotificationCenter.default.post(name: NSNotification.Name("ReloadMiniApp"), object: nil)
                            withAnimation {
                                isExpanded = false
                            }
                        }) {
                            Image(systemName: "arrow.clockwise")
                                .font(.title)
                                .foregroundColor(.primary)
                                .frame(width: 50, height: 50)
                                .liquidGlass(cornerRadius: 25)
                        }

                        Button(action: {
                            // Exit Action
                            dismiss()
                            withAnimation {
                                isExpanded = false
                            }
                        }) {
                            Image(systemName: "xmark")
                                .font(.title)
                                .foregroundColor(.primary)
                                .frame(width: 50, height: 50)
                                .liquidGlass(cornerRadius: 25)
                        }
                    }
                    .padding()
                    .glassEffect()
                    .position(x: geometry.size.width / 2, y: geometry.size.height / 2)
                    .transition(.scale)
                    .zIndex(2)
                }

                if !isExpanded {
                    Button(action: {
                        withAnimation {
                            isExpanded.toggle()
                        }
                    }) {
                        Image(systemName: "circle.grid.3x3.fill")
                            .font(.system(size: 24))
                            .foregroundColor(.primary)
                            .frame(width: 60, height: 60)
                    }
                    .liquidGlass(cornerRadius: 100)
                    .position(dragPosition ?? CGPoint(x: geometry.size.width - 50, y: geometry.size.height - 150))
                    .highPriorityGesture(
                        DragGesture()
                        .onChanged { gesture in
                            self.dragPosition = gesture.location
                        }
                        .onEnded { value in
                            var currentPosition = value.location

                            if currentPosition.x > (geometry.size.width / 2) {
                                currentPosition.x = geometry.size.width - 40
                            } else {
                                currentPosition.x = 40
                            }

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
        switch manifest.orientation {
        case "landscape": return .landscape
        case "portrait": return .portrait
        default: return .all
        }
    }
}

// MARK: - WebView Wrapper
private struct RuntimeWebViewWrapper: UIViewRepresentable {
    let manifest: WebRuntimeManifest
    let httpUrl: String

    func makeUIView(context: Context) -> RuntimeWebView {
        let webView = RuntimeWebView(frame: .zero, manifest: manifest)
        webView.loadBundle(httpUrl: httpUrl)

        // Listen for reload notification
        NotificationCenter.default.addObserver(
            forName: NSNotification.Name("ReloadMiniApp"),
            object: nil,
            queue: .main
        ) { _ in
            webView.reload()
        }

        return webView
    }

    func updateUIView(_ uiView: RuntimeWebView, context: Context) {
        // No updates needed
    }
}

// MARK: - View Modifiers
private extension View {
    func supportedOrientations(_ mask: UIInterfaceOrientationMask) -> some View {
        self.onAppear {
            let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene
            windowScene?.requestGeometryUpdate(.iOS(interfaceOrientations: mask))
        }
    }
}

