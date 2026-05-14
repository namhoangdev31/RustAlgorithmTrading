import Foundation

@MainActor
class MiniAppStoreViewModel: ObservableObject {
    @Published var bundles: [Bundle_] = []
    @Published var isLoading: Bool = false
    @Published var downloadingId: String? = nil
    @Published var error: String? = nil

    @Published var launchPath: String? = nil
    @Published var launchBundle: Bundle_? = nil
    @Published var launchManifest: WebRuntimeManifest? = nil
    @Published var isShowingRuntime: Bool = false

    private let getBundlesUseCase: GetBundlesUseCase
    private let downloadBundleUseCase: DownloadBundleUseCase

    init(
        getBundlesUseCase: GetBundlesUseCase,
        downloadBundleUseCase: DownloadBundleUseCase
    ) {
        self.getBundlesUseCase = getBundlesUseCase
        self.downloadBundleUseCase = downloadBundleUseCase
    }

    func loadBundles() async {
        isLoading = true
        error = nil

        let result = await getBundlesUseCase.execute()
        switch result {
        case .success(let list):
            bundles = list
        case .error(let appError):
            error = message(from: appError)
        }

        isLoading = false
    }

    func downloadAndLaunch(bundle: Bundle_) async {
        guard downloadingId == nil else { return }

        downloadingId = bundle.id
        error = nil

        let result = await downloadBundleUseCase.execute(bundleId: bundle.id)

        switch result {
        case .success(let path):
            launchPath = path
            launchBundle = bundle

            if let manifest = parseManifest(path: path, bundle: bundle) {
                launchManifest = manifest
                isShowingRuntime = true
            } else {
                error = "Invalid manifest.json"
            }
        case .error(let appError):
            error = message(from: appError)
        }

        downloadingId = nil
    }

    func uninstallBundle(bundle: Bundle_) {
        print("Uninstalling \(bundle.name)")
    }

    func isDownloaded(bundleId: String) -> Bool {
        false
    }

    private func parseManifest(path: String, bundle: Bundle_) -> WebRuntimeManifest? {
        let bundleUrl = URL(fileURLWithPath: path)
        let manifestUrl = bundleUrl.appendingPathComponent("manifest.json")

        guard
            let data = try? Data(contentsOf: manifestUrl),
            let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        else {
            return nil
        }

        let id = json["id"] as? String ?? bundle.id
        let version = json["version"] as? String ?? String(json["version"] as? Int ?? 1)
        let name = json["name"] as? String ?? bundle.name
        let entry = json["entry"] as? String ?? "index.html"
        let typeString = (json["type"] as? String)?.uppercased() ?? "STANDARD"
        let orientation = json["orientation"] as? String ?? "portrait"
        let fullScreen = json["fullScreen"] as? Bool ?? true
        let runtimeType = typeString == "FLUTTER" ? "flutter" : "standard"

        return WebRuntimeManifest(
            id: id,
            version: version,
            name: name,
            entry: entry,
            type: runtimeType,
            orientation: orientation,
            fullScreen: fullScreen
        )
    }

    private func message(from error: AppError) -> String {
        switch error {
        case .networkError(let message, _): return message ?? "Network error"
        case .serverError(_, let message): return message ?? "Server error"
        case .databaseError(let message, _): return message ?? "Database error"
        case .unknownError(let message, _): return message ?? "Unknown error"
        case .validationError(let message): return message ?? "Validation error"
        }
    }
}
