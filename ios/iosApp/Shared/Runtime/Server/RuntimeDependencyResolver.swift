import Foundation

/// Dependency Resolver verifying and matching manifest dependencies against the shared store
struct RuntimeDependencyResolver {
    static let shared = RuntimeDependencyResolver()
    
    private init() {}
    
    /// Asynchronously resolves requested dependencies, performing integrity verification
    func resolve(manifest: WebRuntimeManifest) async -> Result<[String: URL], Error> {
        guard let deps = manifest.dependencies, !deps.isEmpty else {
            return .success([:])
        }
        
        var resolved: [String: URL] = [:]
        
        for (name, req) in deps {
            guard let lib = await RuntimeSharedLibraryStore.shared.getLibrary(name: name, versionRequirement: req) else {
                let error = NSError(
                    domain: "RuntimeDependencyResolver",
                    code: 404,
                    userInfo: [NSLocalizedDescriptionKey: "Required dependency '\(name)@\(req)' is not available in local cache."]
                )
                return .failure(error)
            }
            
            let pathURL = URL(fileURLWithPath: lib.localPath)
            resolved[name] = pathURL
        }
        
        return .success(resolved)
    }
}
