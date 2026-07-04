import Foundation

/// Core Package Manager mounting resolved library dependencies onto the local web server routes
@MainActor
final class RuntimePackageManager {
    static let shared = RuntimePackageManager()
    
    private init() {}
    
    /// Resolves dependencies declared in manifest and mounts their paths on the target web server route.
    func resolveAndMountDependencies(
        manifest: WebRuntimeManifest,
        server: iOSWebServer,
        completion: @escaping (Result<Void, Error>) -> Void
    ) {
        Task {
            let result = await RuntimeDependencyResolver.shared.resolve(manifest: manifest)
            switch result {
            case .success(let resolved):
                for (libName, pathURL) in resolved {
                    let routePath = "/node_modules/\(libName)"
                    server.mountDirectory(routePath, directoryPath: pathURL.path)
                }
                completion(.success(()))
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }
}
