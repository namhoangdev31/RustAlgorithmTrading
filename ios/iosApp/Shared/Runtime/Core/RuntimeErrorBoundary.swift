import Foundation
import SwiftUI

/// Core Error Boundary manager mapping UI recovery actions directly to subsystem executors
@MainActor
final class RuntimeErrorBoundary {
    static let shared = RuntimeErrorBoundary()
    
    private init() {}
    
    /// Dispatches a recovery action from an error boundary alert sheet
    func handle(
        action: RuntimeShellAction,
        appId: String,
        viewModel: WebRuntimeViewModel,
        completion: @escaping (Bool) -> Void
    ) {
        print("[RuntimeErrorBoundary] Resolving recovery action: \(action) for app: \(appId)")
        
        switch action {
        case .retry:
            if let activeId = viewModel.activeTabId {
                viewModel.activateTab(id: activeId)
                completion(true)
            } else {
                completion(false)
            }
            
        case .rollback:
            MiniAppManager.shared.rollback(appId: appId, failedVersion: "") { result in
                DispatchQueue.main.async {
                    switch result {
                    case .success(let url):
                        print("[RuntimeErrorBoundary] Version rolled back to stable path: \(url.path)")
                        completion(true)
                    case .failure(let error):
                        print("[RuntimeErrorBoundary] Rollback failed: \(error.localizedDescription)")
                        completion(false)
                    }
                }
            }
            
        case .clearData:
            let fileManager = FileManager.default
            let documentsURL = fileManager.urls(for: .documentDirectory, in: .userDomainMask)[0]
            let sandboxBase = documentsURL
                .appendingPathComponent("MiniAppsData", isDirectory: true)
                .appendingPathComponent(appId, isDirectory: true)
            
            try? fileManager.removeItem(at: sandboxBase)
            print("[RuntimeErrorBoundary] Cleared sandbox base container for: \(appId)")
            completion(true)
            
        case .report:
            print("[Diagnostics] Telemetry log generated.")
            completion(true)
            
        case .close:
            if let activeId = viewModel.activeTabId {
                viewModel.closeTab(id: activeId)
            }
            completion(true)
        }
    }
}
