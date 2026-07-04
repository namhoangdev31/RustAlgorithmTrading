import Foundation

/// Capability Negotiator validating Mini App runtime version requirements and capabilities against the host device
struct RuntimeCapabilityNegotiator {
    static let shared = RuntimeCapabilityNegotiator()
    
    private init() {}
    
    /// Evaluates if the manifest complies with versioning limits and host capabilities.
    func negotiate(manifest: WebRuntimeManifest) -> Result<Void, Error> {
        // 1. Verify runtime version compatibility
        let minVerStr = manifest.minRuntimeVersion
        let maxVerStr = manifest.maxRuntimeVersion
        
        let currentVer = RuntimeVersion.current
        if !currentVer.satisfies(minVersion: minVerStr, maxVersion: maxVerStr) {
            let error = NSError(
                domain: "RuntimeCapabilityNegotiator",
                code: 403,
                userInfo: [NSLocalizedDescriptionKey: "Runtime version \(currentVer.description) does not satisfy minVersion: \(minVerStr ?? "none"), maxVersion: \(maxVerStr ?? "none")."]
            )
            return .failure(error)
        }
        
        // 2. Verify all required permissions as capability requirements
        let requiredCaps = manifest.permissions?.map { $0.key } ?? []
        let currentCaps = RuntimeCapabilities.current
        
        var missing: [String] = []
        for cap in requiredCaps {
            if !currentCaps.supports(capability: cap) {
                missing.append(cap)
            }
        }
        
        if !missing.isEmpty {
            let error = NSError(
                domain: "RuntimeCapabilityNegotiator",
                code: 400,
                userInfo: [NSLocalizedDescriptionKey: "Host environment does not support required capabilities: \(missing.joined(separator: ", "))."]
            )
            return .failure(error)
        }
        
        return .success(())
    }
}
