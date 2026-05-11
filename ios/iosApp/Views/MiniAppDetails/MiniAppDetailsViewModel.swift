import Foundation
// import Shared — replaced by native Swift Shared module

@MainActor
class MiniAppDetailsViewModel: ObservableObject {
    @Published var isDownloaded: Bool = false
    @Published var isLoading: Bool = false
    @Published var error: String? = nil
    
    // Launch state
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
        // Simple check: if the directory exists
        // In a real app, you might want to check for completion or strict paths
        let documents = fileManager.urls(for: .documentDirectory, in: .userDomainMask).first!
        let bundlePath = documents.appendingPathComponent("mini-apps").appendingPathComponent(bundle.id)
        
        // Check for index.html or manifest.json to confirm it's valid
        let manifestPath = bundlePath.appendingPathComponent("manifest.json")
        isDownloaded = fileManager.fileExists(atPath: manifestPath.path)
    }
    
    func downloadAndLaunch(bundle: Bundle_) async {
        isLoading = true
        error = nil
        
        do {
            let result = try await downloadBundleUseCase.invoke(bundle: bundle)
            
            if let success = result as? ResultSuccess<NSString>, let path = success.data as String? {
                self.launchPath = path
                self.launchBundle = bundle
                self.isDownloaded = true
                
                // Parse manifest
                parseManifestAndLaunch(path: path, bundle: bundle)
            } else if let failure = result as? ResultError {
                self.error = failure.error.message ?? "Download failed"
            }
        } catch {
            self.error = error.localizedDescription
        }
        
        isLoading = false
    }
    
    func openMiniApp(bundle: Bundle_) {
        // Assuming it is already downloaded, find the path
        let documents = fileManager.urls(for: .documentDirectory, in: .userDomainMask).first!
        let bundlePath = documents.appendingPathComponent("mini-apps").appendingPathComponent(bundle.id)
        
        if fileManager.fileExists(atPath: bundlePath.path) {
            self.launchPath = bundlePath.path
            self.launchBundle = bundle
            parseManifestAndLaunch(path: bundlePath.path, bundle: bundle)
        } else {
            // Unexpected state, maybe try downloading again?
            Task {
                await downloadAndLaunch(bundle: bundle)
            }
        }
    }
    
    func uninstallBundle(bundle: Bundle_) {
        let documents = fileManager.urls(for: .documentDirectory, in: .userDomainMask).first!
        let bundlePath = documents.appendingPathComponent("mini-apps").appendingPathComponent(bundle.id)
        
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
        
        if let data = try? Data(contentsOf: manifestUrl),
           let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
            
            let id = json["id"] as? String ?? bundle.id
            let version = json["version"] as? String ?? String(json["version"] as? Int ?? 1)
            let name = json["name"] as? String ?? bundle.name
            let entry = json["entry"] as? String ?? "index.html"
            let typeString = (json["type"] as? String)?.uppercased() ?? "STANDARD"
            let orientation = json["orientation"] as? String ?? "portrait"
            let fullScreen = json["fullScreen"] as? Bool ?? true
            
            let runtimeType: String = (typeString == "FLUTTER") ? .flutter : .standard
            
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
        } else {
            self.error = "Invalid manifest.json"
        }
    }
}
