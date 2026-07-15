import Foundation
import SwiftData

@Model
final class QuantAntCacheEntry {
    @Attribute(.unique) var cacheKey: String
    var payload: Data
    var updatedAt: Date
    var staleAt: Date

    init(cacheKey: String, payload: Data, updatedAt: Date, staleAt: Date) {
        self.cacheKey = cacheKey
        self.payload = payload
        self.updatedAt = updatedAt
        self.staleAt = staleAt
    }
}

@Model
final class QuantAntPreferenceEntry {
    @Attribute(.unique) var key: String
    var value: String

    init(key: String, value: String) {
        self.key = key
        self.value = value
    }
}

@MainActor
final class QuantAntCache {
    private let context: ModelContext
    private let encoder: JSONEncoder
    private let decoder: JSONDecoder

    init(container: ModelContainer) {
        context = ModelContext(container)
        encoder = JSONEncoder()
        encoder.keyEncodingStrategy = .convertToSnakeCase
        encoder.dateEncodingStrategy = .iso8601
        decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        decoder.dateDecodingStrategy = .iso8601
    }

    func save<T: Encodable>(_ value: T, key: String, maxAge: TimeInterval) throws {
        let data = try encoder.encode(value)
        let descriptor = FetchDescriptor<QuantAntCacheEntry>(predicate: #Predicate { $0.cacheKey == key })
        let now = Date()
        if let entry = try context.fetch(descriptor).first {
            entry.payload = data
            entry.updatedAt = now
            entry.staleAt = now.addingTimeInterval(maxAge)
        } else {
            context.insert(QuantAntCacheEntry(cacheKey: key, payload: data, updatedAt: now, staleAt: now.addingTimeInterval(maxAge)))
        }
        try context.save()
    }

    func load<T: Decodable>(_ type: T.Type, key: String) throws -> (value: T, isStale: Bool)? {
        let descriptor = FetchDescriptor<QuantAntCacheEntry>(predicate: #Predicate { $0.cacheKey == key })
        guard let entry = try context.fetch(descriptor).first else { return nil }
        return (try decoder.decode(type, from: entry.payload), entry.staleAt <= Date())
    }

    func preference(key: String) throws -> String? {
        let descriptor = FetchDescriptor<QuantAntPreferenceEntry>(predicate: #Predicate { $0.key == key })
        return try context.fetch(descriptor).first?.value
    }

    func setPreference(_ value: String, key: String) throws {
        let descriptor = FetchDescriptor<QuantAntPreferenceEntry>(predicate: #Predicate { $0.key == key })
        if let entry = try context.fetch(descriptor).first { entry.value = value }
        else { context.insert(QuantAntPreferenceEntry(key: key, value: value)) }
        try context.save()
    }

    static func makeContainer() -> ModelContainer {
        do {
            return try ModelContainer(for: QuantAntCacheEntry.self, QuantAntPreferenceEntry.self)
        } catch {
            let configuration = ModelConfiguration(isStoredInMemoryOnly: true)
            return try! ModelContainer(for: QuantAntCacheEntry.self, QuantAntPreferenceEntry.self, configurations: configuration)
        }
    }
}
