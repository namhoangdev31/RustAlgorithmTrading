import Foundation
import WasmKit
import SystemPackage
import CryptoKit

final class WasmExecutor: @unchecked Sendable {
    static let shared = WasmExecutor()
    
    private let engine = Engine()
    private lazy var store = Store(engine: engine)
    private var modules: [String: Module] = [:]
    private let lock = NSLock()
    
    func execute(
        wasmPath: String,
        functionName: String,
        args: [Any],
        expectedHash: String? = nil
    ) throws -> [Any] {
        lock.lock()
        defer { lock.unlock() }

        // Verify SHA256 checksum if provided
        if let expectedHash = expectedHash {
            try verifySHA256(filePath: wasmPath, expectedHash: expectedHash)
        } else {
            print("[Security Warning] Running WASM file without SHA256 signature verification: \(wasmPath)")
        }
        
        // 1. Get or load the module
        let module: Module
        if let cached = modules[wasmPath] {
            module = cached
        } else {
            let path = FilePath(wasmPath)
            module = try parseWasm(filePath: path)
            modules[wasmPath] = module
        }
        
        // 2. Instantiate module
        let instance = try module.instantiate(store: store)
        
        // 3. Find the function
        guard let function = instance.exports[function: functionName] else {
            throw NSError(domain: "WasmExecutor", code: 404, userInfo: [NSLocalizedDescriptionKey: "Function '\(functionName)' not found in module."])
        }
        
        // 4. Map arguments to WasmKit.Value
        let wasmArgs = try args.map { try convertToWasmValue($0) }
        
        // 5. Invoke the function
        let results = try function(wasmArgs)
        
        // 6. Map results back to Swift types
        return results.map { convertFromWasmValue($0) }
    }
    
    private func convertToWasmValue(_ value: Any) throws -> WasmKit.Value {
        if let intVal = value as? Int {
            return .i32(UInt32(intVal))
        } else if let int32Val = value as? Int32 {
            return .i32(UInt32(int32Val))
        } else if let int64Val = value as? Int64 {
            return .i64(UInt64(int64Val))
        } else if let doubleVal = value as? Double {
            return .f64(doubleVal.bitPattern)
        } else if let floatVal = value as? Float {
            return .f32(floatVal.bitPattern)
        } else if let stringVal = value as? String {
            if let intVal = Int(stringVal) {
                return .i32(UInt32(intVal))
            } else if let doubleVal = Double(stringVal) {
                return .f64(doubleVal.bitPattern)
            }
        } else if let dict = value as? [String: Any],
                  let type = dict["type"] as? String,
                  let val = dict["value"] {
            switch type.lowercased() {
            case "i32":
                if let i = val as? Int32 { return .i32(UInt32(i)) }
                if let i = val as? Int { return .i32(UInt32(i)) }
                if let s = val as? String, let i = Int(s) { return .i32(UInt32(i)) }
            case "i64":
                if let i = val as? Int64 { return .i64(UInt64(i)) }
                if let i = val as? Int { return .i64(UInt64(i)) }
                if let s = val as? String, let i = Int64(s) { return .i64(UInt64(i)) }
            case "f32":
                if let f = val as? Float { return .f32(f.bitPattern) }
                if let d = val as? Double { return .f32(Float(d).bitPattern) }
                if let s = val as? String, let f = Float(s) { return .f32(f.bitPattern) }
            case "f64":
                if let d = val as? Double { return .f64(d.bitPattern) }
                if let f = val as? Float { return .f64(Double(f).bitPattern) }
                if let s = val as? String, let d = Double(s) { return .f64(d.bitPattern) }
            default:
                break
            }
        }
        
        throw NSError(domain: "WasmExecutor", code: 400, userInfo: [NSLocalizedDescriptionKey: "Unsupported Wasm argument: \(value)"])
    }
    
    private func convertFromWasmValue(_ value: WasmKit.Value) -> Any {
        switch value {
        case .i32(let val):
            return Int32(bitPattern: val)
        case .i64(let val):
            return Int64(bitPattern: val)
        case .f32(let val):
            return Float(bitPattern: val)
        case .f64(let val):
            return Double(bitPattern: val)
        case .ref(let val):
            return "ref(\(val))"
        }
    }
    
    private func verifySHA256(filePath: String, expectedHash: String) throws {
        let fileURL = URL(fileURLWithPath: filePath)
        let fileData = try Data(contentsOf: fileURL)
        let hash = SHA256.hash(data: fileData)
        let hashString = hash.compactMap { String(format: "%02x", $0) }.joined()
        
        guard hashString.lowercased() == expectedHash.lowercased() else {
            throw NSError(domain: "WasmExecutor", code: 403, userInfo: [
                NSLocalizedDescriptionKey: "Wasm security check failed. Checksum mismatch. Expected: \(expectedHash), got: \(hashString)"
            ])
        }
    }
}
