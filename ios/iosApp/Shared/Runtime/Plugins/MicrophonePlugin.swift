import Foundation
import AVFoundation

final class MicrophonePlugin: RuntimePlugin, @unchecked Sendable {
    var descriptor: PluginDescriptor {
        return PluginDescriptor(
            action: "microphone.record",
            permission: .microphone,
            policy: .protected
        ) { [weak self] action, payload, bundlePath, completion in
            guard let self = self else { return }
            Task {
                let response = await self.handle(BridgeRequest(
                    appId: payload["appId"] as? String ?? "",
                    action: action,
                    payload: payload,
                    bundlePath: bundlePath
                ))
                if response.success {
                    completion(.success(response.data))
                } else {
                    completion(.failure(NSError(
                        domain: "MicrophonePlugin",
                        code: 400,
                        userInfo: [NSLocalizedDescriptionKey: response.errorMessage ?? "Error"]
                    )))
                }
            }
        }
    }

    private var audioRecorder: AVAudioRecorder?

    func handle(_ request: BridgeRequest) async -> BridgeResponse {
        let action = request.action
        let payload = request.payload
        let appId = request.appId.isEmpty ? "default_app" : request.appId

        if action == "microphone.record" {
            let command = payload["command"] as? String ?? "start"

            if command == "start" {
                return await startRecording(appId: appId)
            } else if command == "stop" {
                return await stopRecording()
            }
        }

        return .failure(code: "UNKNOWN_ACTION", message: "Unsupported Microphone action.")
    }

    @MainActor
    private func startRecording(appId: String) async -> BridgeResponse {
        // Update global Recording State manager to display visual warning banner
        RecordingStateManager.shared.isMicrophoneActive = true

        let fileManager = FileManager.default
        let documentsURL = fileManager.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let sandboxBase = documentsURL
            .appendingPathComponent("MiniAppsData", isDirectory: true)
            .appendingPathComponent(appId, isDirectory: true)
            .standardized
            .resolvingSymlinksInPath()

        let fileURL = sandboxBase.appendingPathComponent("temp_audio.m4a")

        // Ensure directories exist
        try? fileManager.createDirectory(at: sandboxBase, withIntermediateDirectories: true, attributes: nil)

        let settings: [String: Any] = [
            AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
            AVSampleRateKey: 12000.0,
            AVNumberOfChannelsKey: 1,
            AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue
        ]

        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playAndRecord, mode: .default, options: [])
            try session.setActive(true)

            let recorder = try AVAudioRecorder(url: fileURL, settings: settings)
            recorder.record()
            self.audioRecorder = recorder

            // Monitor state changes to support manual cancellation from Native Shell stop button
            Task {
                while true {
                    try? await Task.sleep(nanoseconds: 500_000_000)
                    let active = RecordingStateManager.shared.isMicrophoneActive
                    if !active {
                        stopRecordingSync()
                        break
                    }
                    if self.audioRecorder == nil || !self.audioRecorder!.isRecording {
                        break
                    }
                }
            }

            return .success([
                "recording": true,
                "tempPath": "temp_audio.m4a"
            ])
        } catch {
            RecordingStateManager.shared.isMicrophoneActive = false
            return .failure(code: "RECORDER_ERROR", message: error.localizedDescription)
        }
    }

    @MainActor
    private func stopRecording() async -> BridgeResponse {
        RecordingStateManager.shared.isMicrophoneActive = false
        stopRecordingSync()
        return .success(["recording": false])
    }

    private func stopRecordingSync() {
        audioRecorder?.stop()
        audioRecorder = nil
        try? AVAudioSession.sharedInstance().setActive(false)
    }
}
