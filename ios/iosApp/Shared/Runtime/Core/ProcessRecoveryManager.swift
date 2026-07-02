import Foundation

@MainActor
final class ProcessRecoveryManager {
    private struct StabilityState {
        var didFinishLoad = false
        var runtimeReady = false
        var markedStable = false
        var crashCount = 0
    }

    private var states: [UUID: StabilityState] = [:]

    func recordRuntimeReady(tabId: UUID, appId: String, version: String) {
        var state = states[tabId] ?? StabilityState()
        state.runtimeReady = true
        states[tabId] = state
        checkAndMarkStable(tabId: tabId, appId: appId, version: version)
    }

    func recordNavigationFinished(tabId: UUID, appId: String, version: String) {
        var state = states[tabId] ?? StabilityState()
        state.didFinishLoad = true
        states[tabId] = state
        checkAndMarkStable(tabId: tabId, appId: appId, version: version)
    }

    func handleWebContentTermination(
        tabId: UUID,
        manifest: WebRuntimeManifest,
        reload: @escaping () -> Void,
        reportError: @escaping (RuntimeShellError) -> Void,
        close: @escaping () -> Void
    ) {
        var state = states[tabId] ?? StabilityState()
        state.crashCount += 1
        state.didFinishLoad = false
        state.runtimeReady = false
        state.markedStable = false
        states[tabId] = state

        let crashCount = state.crashCount
        let delay: TimeInterval = crashCount == 2 ? 1.0 : 0.0
        reportError(.webContentKilled("Web content process was killed for \(manifest.name). Attempting recovery \(crashCount)/3."))

        MiniAppManager.shared.registerLaunch(appId: manifest.id, currentVersion: manifest.version) { result in
            DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
                switch result {
                case .success:
                    reload()
                case .failure(let error):
                    reportError(.crashedVersion(error.localizedDescription))
                    close()
                }
            }
        }
    }

    private func checkAndMarkStable(tabId: UUID, appId: String, version: String) {
        guard var state = states[tabId],
              state.didFinishLoad,
              state.runtimeReady,
              !state.markedStable else { return }

        state.markedStable = true
        states[tabId] = state

        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            var nextState = self.states[tabId] ?? StabilityState()
            nextState.crashCount = 0
            self.states[tabId] = nextState
            MiniAppManager.shared.markStable(appId: appId, version: version)
        }
    }
}
