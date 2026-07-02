import Foundation
import CryptoKit

/// Helper for cryptographic bundle integrity verification using Ed25519 and SHA256 hashes
final class BundleVerifier {
    /// Public key for Ed25519 signature checks (32-byte raw representation base64-encoded)
    private static let publicKeyBase64 = "dGVzdHB1YmxpY2tleWR1bW15MTIzNDU2Nzg5MDEyMzQ="
    
    static func verify(bundleDirectory: URL) -> Bool {
        let signatureURL = bundleDirectory.appendingPathComponent("signature.sig")
        let hashesURL = bundleDirectory.appendingPathComponent("hashes.json")
        
        guard let signatureData = try? Data(contentsOf: signatureURL),
              let hashesData = try? Data(contentsOf: hashesURL) else {
            print("[Security] Missing signature.sig or hashes.json in bundle.")
            return false
        }
        
        do {
            // 1. Load public key
            guard let keyData = Data(base64Encoded: publicKeyBase64) else {
                print("[Security] Failed to decode public key base64.")
                return false
            }
            let publicKey = try Curve25519.Signing.PublicKey(rawRepresentation: keyData)
            
            // 2. Verify Ed25519 signature of hashes.json
            guard publicKey.isValidSignature(signatureData, for: hashesData) else {
                print("[Security] Ed25519 Signature verification failed for hashes.json.")
                return false
            }
            
            // 3. Decode hashes and verify file integrity
            let fileHashes = try JSONDecoder().decode([String: String].self, from: hashesData)
            for (relativePath, expectedHash) in fileHashes {
                let fileURL = bundleDirectory.appendingPathComponent(relativePath)
                guard FileManager.default.fileExists(atPath: fileURL.path) else {
                    print("[Security] File missing: \(relativePath)")
                    return false
                }
                
                let fileData = try Data(contentsOf: fileURL)
                let actualHash = SHA256.hash(data: fileData).compactMap { String(format: "%02x", $0) }.joined()
                
                guard actualHash.lowercased() == expectedHash.lowercased() else {
                    print("[Security] SHA256 mismatch for \(relativePath). Expected: \(expectedHash), got: \(actualHash)")
                    return false
                }
            }
            
            print("[Security] Bundle signature and integrity verified successfully.")
            return true
        } catch {
            print("[Security] Cryptographic verification failed: \(error.localizedDescription)")
            return false
        }
    }
}
