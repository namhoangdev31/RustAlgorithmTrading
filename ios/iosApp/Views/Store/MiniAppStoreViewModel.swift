import Foundation
// import Shared — replaced by native Swift Shared module

@MainActor
class MiniAppStoreViewModel: ObservableObject {
    @Published var bundles: [Bundle_] = []
    @Published var isLoading: Bool = false
    @Published var downloadingId: String? = nil
    @Published var error: String? = nil
    
    // For navigation/launch
    @Published var launchPath: String? = nil // Path to bundle to launch
    @Published var launchBundle: Bundle_? = nil // Bundle metadata for launch
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
        
        do {
            let result = try await getBundlesUseCase.invoke()
            
            if let success = result as? ResultSuccess<NSArray> {
                if let list = success.data as? [Bundle_] {
                    self.bundles = list
                }
            } else if let failure = result as? ResultError {
                self.error = failure.error.message ?? "Failed to load bundles"
            }
        } catch {
            self.error = error.localizedDescription
        }
        
        isLoading = false
    }
    
    func downloadAndLaunch(bundle: Bundle_) async {
        guard downloadingId == nil else { return }
        
        downloadingId = bundle.id
        error = nil
        
        do {
            let result = try await downloadBundleUseCase.invoke(bundle: bundle)
            
            if let success = result as? ResultSuccess<NSString>, let path = success.data as String? {
                self.launchPath = path
                self.launchBundle = bundle
                
                // Parse manifest
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
                    // Fallback or Error
                    self.error = "Invalid manifest.json"
                }
            } else if let failure = result as? ResultError {
                self.error = failure.error.message ?? "Download failed"
            }
        } catch {
            self.error = error.localizedDescription
        }
        
        downloadingId = nil
    }
    
    func uninstallBundle(bundle: Bundle_) {
        // Mock uninstall: In a real app, delete the file at the path.
        print("Uninstalling \(bundle.name)")
    }
    
    func isDownloaded(bundleId: String) -> Bool {
        // Simplified check.
        return false 
    }
}
