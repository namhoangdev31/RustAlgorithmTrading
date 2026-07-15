import DeviceCheck
import ExploreSwiftUI
import LocalAuthentication
import Observation
import SwiftUI

@MainActor @Observable
final class QuantAntLiveUnlockModel {
    var state: QuantAntViewState = .idle

    func unlock() async {
        state = .loading
        let context = LAContext()
        var error: NSError?
        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
            state = .error(message: error?.localizedDescription ?? "Biometrics unavailable", retryable: false)
            return
        }
        do {
            let approved = try await context.evaluatePolicy(
                .deviceOwnerAuthenticationWithBiometrics,
                localizedReason: "Unlock a five-minute QuantAnt live session"
            )
            guard approved else { state = .unauthorized; return }
            guard DCAppAttestService.shared.isSupported else {
                state = .unsupported("security.app_attest")
                return
            }
            state = .unsupported("security.app_attest.server_verification")
        } catch {
            state = .error(message: error.localizedDescription, retryable: true)
        }
    }
}

struct QuantAntLiveUnlockView: View {
    @State private var model = QuantAntLiveUnlockModel()

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "faceid").font(.system(size: 64)).uniForegroundStyle(QuantAntTheme.indigo)
            Text("Live Session Unlock").font(.title.bold())
            Text("Live sessions are device-bound, biometric-protected and expire after five minutes.")
                .multilineTextAlignment(.center).uniForegroundStyle(.secondary)
            QuantAntStateView(state: model.state, retry: nil) { EmptyView() }
                .frame(maxHeight: 140)
            UniButton("Authenticate") { Task { await model.unlock() } }
                .uniButtonStyle(.borderedProminent)
                .disabled(model.state == .loading)
        }
        .padding()
        .uniNavigationTitle("Live unlock")
    }
}

