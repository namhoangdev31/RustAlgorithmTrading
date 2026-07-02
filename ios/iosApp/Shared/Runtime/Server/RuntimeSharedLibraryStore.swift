import Foundation

/// Shared library metadata representing bundle dependencies
struct SharedLibrary: Sendable {
    let name: String
    let version: String
    let localPath: String
    let sha256: String
}

/// Actor-based store caching and mapping resolved shared library directories
actor RuntimeSharedLibraryStore {
    static let shared = RuntimeSharedLibraryStore()
    
    private var libraries: [String: SharedLibrary] = [:] // Key is "name@version"
    
    private init() {
        // Pre-register standard runtime core library mock for MVP
        let documents = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let mockPath = documents.appendingPathComponent("SharedLibs/core/1.0.0").path
        let mockLib = SharedLibrary(
            name: "@runtime/core",
            version: "1.0.0",
            localPath: mockPath,
            sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        )
        libraries["\(mockLib.name)@\(mockLib.version)"] = mockLib
    }
    
    /// Registers a validated shared library
    func registerLibrary(_ library: SharedLibrary) {
        let key = "\(library.name)@\(library.version)"
        libraries[key] = library
    }
    
    /// Resolves a library matching the requested name and semver version requirement
    func getLibrary(name: String, versionRequirement: String) -> SharedLibrary? {
        let reqPrefix = versionRequirement
            .replacingOccurrences(of: "x", with: "")
            .replacingOccurrences(of: "*", with: "")
            .trimmingCharacters(in: CharacterSet(charactersIn: "."))
        
        for lib in libraries.values {
            if lib.name == name {
                if lib.version.hasPrefix(reqPrefix) {
                    return lib
                }
            }
        }
        return nil
    }
}
