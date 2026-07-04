import Foundation

/// Scheduler states for executing components within the App Shell lifecycle
enum RuntimeSchedulerState: Sendable {
    case foreground
    case background
    case hidden
    case suspended
}
