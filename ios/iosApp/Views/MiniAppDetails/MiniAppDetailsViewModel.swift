import Foundation

@MainActor
class MiniAppDetailsViewModel: ObservableObject {
    @Published var isDownloaded: Bool = false
    @Published var isLoading: Bool = false
    @Published var error: String? = nil

    @Published var launchPath: String? = nil
    @Published var launchBundle: Bundle_? = nil
    @Published var launchManifest: WebRuntimeManifest? = nil
    @Published var isShowingRuntime: Bool = false

    private let downloadBundleUseCase: DownloadBundleUseCase
    private let fileManager = FileManager.default

    init(downloadBundleUseCase: DownloadBundleUseCase) {
        self.downloadBundleUseCase = downloadBundleUseCase
    }

    func checkDownloadStatus(bundle: Bundle_) {
        let documents = fileManager.urls(for: .documentDirectory, in: .userDomainMask).first!
        let bundlePath = documents.appendingPathComponent("bundles").appendingPathComponent(bundle.id)
        let manifestPath = bundlePath.appendingPathComponent("manifest.json")
        isDownloaded = fileManager.fileExists(atPath: manifestPath.path)
    }

    func downloadAndLaunch(bundle: Bundle_) async {
        isLoading = true
        error = nil

        let result = await downloadBundleUseCase.execute(bundleId: bundle.id)

        switch result {
        case .success(let path):
            launchPath = path
            launchBundle = bundle
            isDownloaded = true
            parseManifestAndLaunch(path: path, bundle: bundle)
        case .error(let appError):
            error = message(from: appError)
        }

        isLoading = false
    }

    func openMiniApp(bundle: Bundle_) {
        let documents = fileManager.urls(for: .documentDirectory, in: .userDomainMask).first!
        let bundlePath = documents.appendingPathComponent("bundles").appendingPathComponent(bundle.id)

        if fileManager.fileExists(atPath: bundlePath.path) {
            launchPath = bundlePath.path
            launchBundle = bundle
            parseManifestAndLaunch(path: bundlePath.path, bundle: bundle)
        } else {
            Task { await downloadAndLaunch(bundle: bundle) }
        }
    }

    func uninstallBundle(bundle: Bundle_) {
        let documents = fileManager.urls(for: .documentDirectory, in: .userDomainMask).first!
        let bundlePath = documents.appendingPathComponent("bundles").appendingPathComponent(bundle.id)

        do {
            if fileManager.fileExists(atPath: bundlePath.path) {
                try fileManager.removeItem(at: bundlePath)
                isDownloaded = false
            }
        } catch {
            self.error = "Failed to uninstall: \(error.localizedDescription)"
        }
    }

    private func parseManifestAndLaunch(path: String, bundle: Bundle_) {
        let bundleUrl = URL(fileURLWithPath: path)
        let manifestUrl = bundleUrl.appendingPathComponent("manifest.json")

        guard
            let data = try? Data(contentsOf: manifestUrl),
            let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        else {
            self.error = "Invalid manifest.json"
            return
        }

        let id = json["id"] as? String ?? bundle.id
        let version = json["version"] as? String ?? String(json["version"] as? Int ?? 1)
        let name = json["name"] as? String ?? bundle.name
        let entry = json["entry"] as? String ?? "index.html"
        let typeString = (json["type"] as? String)?.uppercased() ?? "STANDARD"
        let orientation = json["orientation"] as? String ?? "portrait"
        let fullScreen = json["fullScreen"] as? Bool ?? true
        let runtimeType = typeString == "FLUTTER" ? "flutter" : "standard"

        self.launchManifest = WebRuntimeManifest(
            id: id,
            version: version,
            name: name,
            entry: entry,
            type: runtimeType,
            orientation: orientation,
            fullScreen: fullScreen
        )

        self.isShowingRuntime = true
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
