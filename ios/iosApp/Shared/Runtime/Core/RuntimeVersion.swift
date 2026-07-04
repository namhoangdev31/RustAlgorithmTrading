import Foundation

/// Semver-compliant Version representation for Runtime Compatibility negotiation
struct RuntimeVersion: Comparable, CustomStringConvertible, Sendable {
    let major: Int
    let minor: Int
    let patch: Int
    
    static let current = RuntimeVersion(major: 1, minor: 0, patch: 0)
    
    var description: String {
        return "\(major).\(minor).\(patch)"
    }
    
    init(major: Int, minor: Int, patch: Int) {
        self.major = major
        self.minor = minor
        self.patch = patch
    }
    
    init?(string: String) {
        let clean = string.trimmingCharacters(in: .whitespacesAndNewlines)
        let parts = clean.split(separator: ".")
        guard parts.count >= 2 else { return nil }
        
        guard let majorVal = Int(parts[0]),
              let minorVal = Int(parts[1]) else { return nil }
              
        let patchVal = parts.count > 2 ? Int(parts[2]) ?? 0 : 0
        
        self.major = majorVal
        self.minor = minorVal
        self.patch = patchVal
    }
    
    static func < (lhs: RuntimeVersion, rhs: RuntimeVersion) -> Bool {
        if lhs.major != rhs.major { return lhs.major < rhs.major }
        if lhs.minor != rhs.minor { return lhs.minor < rhs.minor }
        return lhs.patch < rhs.patch
    }
    
    /// Checks if target version complies with min/max requirements (including wildcards like 2.x)
    func satisfies(minVersion: String?, maxVersion: String?) -> Bool {
        if let minStr = minVersion, let minVer = RuntimeVersion(string: minStr) {
            if self < minVer { return false }
        }
        
        if let maxStr = maxVersion {
            let cleanMax = maxStr.trimmingCharacters(in: .whitespacesAndNewlines)
            if cleanMax.hasSuffix(".x") || cleanMax.hasSuffix(".*") {
                let prefix = cleanMax.dropLast(2)
                if let maxMajor = Int(prefix) {
                    if self.major > maxMajor { return false }
                }
            } else if let maxVer = RuntimeVersion(string: cleanMax) {
                if self > maxVer { return false }
            }
        }
        
        return true
    }
}
