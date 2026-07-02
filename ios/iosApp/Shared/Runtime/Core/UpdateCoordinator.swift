import Foundation

final class UpdateCoordinator {
    private let stateStore = RuntimeStateStore()

    func prepareLaunch(
        manifest: WebRuntimeManifest,
        bundlePath: URL,
        completion: @escaping (Result<URL, Error>) -> Void
    ) {
        MiniAppManager.shared.registerLaunch(appId: manifest.id, currentVersion: manifest.version) { result in
            switch result {
            case .success(let resolvedURL):
                completion(.success(resolvedURL))
            case .failure(let error):
                self.stateStore.recordPendingUpdate(
                    appId: manifest.id,
                    version: manifest.version,
                    status: "failed",
                    error: error.localizedDescription
                )
                completion(.failure(error))
            }
        }
    }
}
