import Foundation

/// Actor-based telemetry metrics storage verifying values and counters asynchronously
actor RuntimeMetricStore {
    static let shared = RuntimeMetricStore()
    
    private var metrics: [String: [Double]] = [:]
    private var counters: [String: Int] = [:]
    
    private init() {}
    
    /// Records a decimal measurement value
    func recordMetric(key: String, value: Double) {
        var values = metrics[key] ?? []
        values.append(value)
        metrics[key] = values
    }
    
    /// Increments a metric counter value
    func incrementCounter(key: String) {
        counters[key] = (counters[key] ?? 0) + 1
    }
    
    /// Retrieves current measurements snapshot
    func getMetrics() -> [String: [Double]] {
        return metrics
    }
    
    /// Retrieves current counters snapshot
    func getCounters() -> [String: Int] {
        return counters
    }
}
