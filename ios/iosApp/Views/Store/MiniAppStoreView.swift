import ExploreSwiftUI
import SwiftUI

// import Shared — replaced by native Swift Shared module

struct MiniAppStoreView: View {
    @StateObject private var viewModel: MiniAppStoreViewModel
    @Environment(\.appContainer) private var container

    // We need DI container in iOS app to provide these dependencies.
    // For now assuming we inject instances.
    init(viewModel: MiniAppStoreViewModel) {
        _viewModel = StateObject(wrappedValue: viewModel)
    }

    var body: some View {
        NavigationView {
            ZStack {
                if viewModel.isLoading && viewModel.bundles.isEmpty {
                    UniProgressView()
                } else {
                    UniList(viewModel.bundles, id: \.id) { bundle in
                        ZStack {
                            NavigationLink(destination: MiniAppDetailsView()) {
                                EmptyView()
                            }
                            .opacity(0.0)

                            HStack {
                                VStack(alignment: .leading) {
                                    Text(bundle.name)
                                        .font(.headline)
                                    Text("v\(bundle.id)")
                                        .font(.caption)
                                        .uniForegroundStyle(.secondary)
                                }
                                Spacer()

                                if viewModel.downloadingId == bundle.id {
                                    UniProgressView()
                                } else {
                                    UniButton(action: {
                                        Task {
                                            await viewModel.downloadAndLaunch(bundle: bundle)
                                        }
                                    }) {
                                        Text("OPEN")
                                            .font(.caption)
                                            .fontWeight(.bold)
                                            .uniForegroundStyle(.blue)
                                            .padding(.horizontal, 12)
                                            .padding(.vertical, 6)
                                            .background(Color.blue.opacity(0.1))
                                            .cornerRadius(12)
                                    }
                                    .uniButtonStyle(.plain)
                                }
                            }
                        }
                    }
                    .refreshable {
                        await viewModel.loadBundles()
                    }
                }

                if let error = viewModel.error {
                    VStack {
                        Spacer()
                        Text(error)
                            .padding()
                            .background(Color.red.opacity(0.8))
                            .uniForegroundStyle(.white)
                            .cornerRadius(8)
                            .padding()
                    }
                }
            }
            .uniNavigationTitle("Mini-App Store")
            .task {
                await viewModel.loadBundles()
            }
            .fullScreenCover(isPresented: $viewModel.isShowingRuntime) {
                if let manifest = viewModel.launchManifest, let path = viewModel.launchPath {
                    let vm = container.makeWebRuntimeViewModel()
                    RuntimeView(
                        manifest: manifest,
                        bundlePath: URL(fileURLWithPath: path),
                        viewModel: vm
                    ).ignoresSafeArea()
                        .background(Color.black)
                        .onAppear {
                            vm.loadBundle(
                                manifest: manifest, bundlePath: URL(fileURLWithPath: path))
                        }
                }
            }
        }
    }
}
