import Combine
import Foundation

@MainActor
final class RecordingStateManager: ObservableObject {
    static let shared = RecordingStateManager()
    
    @Published var isMicrophoneActive = false
    @Published var isCameraActive = false
    
    private init() {}
    
    func stopAll() {
        isMicrophoneActive = false
        isCameraActive = false
    }
}
