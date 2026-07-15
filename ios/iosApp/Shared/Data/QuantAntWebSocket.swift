import Foundation

struct QuantAntWebSocketEnvelope: Codable, Sendable {
    let schemaVersion: Int
    let eventID: String
    let sequence: Int64
    let type: String
    let occurredAt: Date
    let accountID: String?
    let aggregateID: String?
    let payload: JSONValue
}

actor QuantAntWebSocketClient {
    private let url: URL
    private let tokenStorage: TokenStorage
    private let session: URLSession
    private var task: URLSessionWebSocketTask?

    init(url: URL, tokenStorage: TokenStorage, session: URLSession = .shared) {
        self.url = url
        self.tokenStorage = tokenStorage
        self.session = session
    }

    func events(resumeSequence: Int64?) -> AsyncThrowingStream<QuantAntWebSocketEnvelope, Error> {
        AsyncThrowingStream { continuation in
            let receiver = Task { await self.receive(resumeSequence: resumeSequence, continuation: continuation) }
            continuation.onTermination = { _ in receiver.cancel() }
        }
    }

    func disconnect() {
        task?.cancel(with: .goingAway, reason: nil)
        task = nil
    }

    private func receive(
        resumeSequence: Int64?,
        continuation: AsyncThrowingStream<QuantAntWebSocketEnvelope, Error>.Continuation
    ) async {
        guard let token = tokenStorage.get(key: "access_token") else {
            continuation.finish(throwing: QuantAntClientError.unauthorized)
            return
        }
        var components = URLComponents(url: url, resolvingAgainstBaseURL: false)!
        if let resumeSequence {
            components.queryItems = [URLQueryItem(name: "resume_sequence", value: String(resumeSequence))]
        }
        var request = URLRequest(url: components.url!)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        let socket = session.webSocketTask(with: request)
        task = socket
        socket.resume()
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        decoder.dateDecodingStrategy = .iso8601
        do {
            while !Task.isCancelled {
                let message = try await socket.receive()
                let data: Data
                switch message {
                case .data(let value): data = value
                case .string(let value): data = Data(value.utf8)
                @unknown default: continue
                }
                continuation.yield(try decoder.decode(QuantAntWebSocketEnvelope.self, from: data))
            }
            continuation.finish()
        } catch {
            continuation.finish(throwing: error)
        }
        task = nil
    }
}
