import Foundation
import WebKit

@MainActor
protocol BridgeResponseSending: AnyObject {
    func sendResponse(requestId: String, data: [String: Any]?, errorCode: String?, errorMessage: String?)
}

struct BridgeRouteContext {
    let manifest: WebRuntimeManifest
    let bundlePath: URL
    let serverURL: URL
    let tabId: UUID
    let onRuntimeReady: () -> Void
    let onHotReload: ([String: Any]) -> Void
    let onRuntimeError: (RuntimeShellError) -> Void
}

@MainActor
final class BridgeRouter {
    static let shared = BridgeRouter(pluginHost: .shared)

    private let pluginHost: PluginHost

    init(pluginHost: PluginHost) {
        self.pluginHost = pluginHost
    }

    func route(
        message: WKScriptMessage,
        context: BridgeRouteContext,
        responder: BridgeResponseSending
    ) {
        guard (message.name == "LeposBridge" || message.name == "lepoShipBridge"),
              let body = message.body as? [String: Any] else {
            return
        }

        let requestId = body["requestId"] as? String ?? ""
        let payload = body["payload"] as? [String: Any] ?? [:]

        guard validateOrigin(message: message, expectedURL: context.serverURL) else {
            let origin = "\(message.frameInfo.securityOrigin.protocol)://\(message.frameInfo.securityOrigin.host):\(message.frameInfo.securityOrigin.port)"
            reject(
                requestId: requestId,
                action: body["action"] as? String ?? "unknown",
                appId: context.manifest.id,
                code: "UNAUTHORIZED_ORIGIN",
                message: "Security origin '\(origin)' is not authorized.",
                responder: responder
            )
            return
        }

        guard let action = body["action"] as? String, !action.isEmpty else {
            reject(
                requestId: requestId,
                action: "unknown",
                appId: context.manifest.id,
                code: "INVALID_ACTION",
                message: "Bridge action is missing.",
                responder: responder
            )
            return
        }

        if handleRuntimeAction(action: action, payload: payload, requestId: requestId, context: context, responder: responder) {
            return
        }

        guard BridgeRateLimiter.shared.isAllowed(
            appId: context.manifest.id,
            tabId: context.tabId,
            action: action,
            policy: pluginHost.rateLimitPolicy(forAction: action, payload: payload)
        ) else {
            reject(
                requestId: requestId,
                action: action,
                appId: context.manifest.id,
                code: "RATE_LIMIT_EXCEEDED",
                message: "Rate limit exceeded for action '\(action)' on this tab.",
                responder: responder
            )
            return
        }

        if let requiredPermission = pluginHost.requiredPermission(forAction: action, payload: payload) {
            let hasGesture = payload["hasUserGesture"] as? Bool ?? false
            let callContext = BridgeCallContext(
                appId: context.manifest.id,
                frameOrigin: "\(message.frameInfo.securityOrigin.protocol)://\(message.frameInfo.securityOrigin.host)",
                hasUserGesture: hasGesture,
                method: action
            )
            
            Task {
                let result = await PermissionManager.shared.requestPermission(
                    appId: context.manifest.id,
                    appName: context.manifest.name,
                    permission: requiredPermission,
                    manifest: context.manifest,
                    context: callContext
                )
                
                await MainActor.run {
                    if result.status == .granted {
                        self.dispatch(action: action, payload: payload, requestId: requestId, context: context, responder: responder)
                    } else {
                        context.onRuntimeError(.permissionDenied("Required permission '\(requiredPermission.rawValue)' was denied or not declared."))
                        let errCode = result.code?.rawValue ?? "PERMISSION_DENIED"
                        self.reject(
                            requestId: requestId,
                            action: action,
                            appId: context.manifest.id,
                            code: errCode,
                            message: "Required permission '\(requiredPermission.rawValue)' was denied or not declared in manifest.",
                            responder: responder
                        )
                    }
                }
            }
            return
        }

        dispatch(action: action, payload: payload, requestId: requestId, context: context, responder: responder)
    }

    private func validateOrigin(message: WKScriptMessage, expectedURL: URL) -> Bool {
        let origin = message.frameInfo.securityOrigin
        let expectedPort = expectedURL.port ?? (expectedURL.scheme == "https" ? 443 : 80)
        return origin.protocol == expectedURL.scheme
            && origin.host == expectedURL.host
            && origin.port == expectedPort
    }

    private func handleRuntimeAction(
        action: String,
        payload: [String: Any],
        requestId: String,
        context: BridgeRouteContext,
        responder: BridgeResponseSending
    ) -> Bool {
        if action == "ready" || action == "runtime.ready" {
            context.onRuntimeReady()
            if !requestId.isEmpty {
                responder.sendResponse(requestId: requestId, data: ["success": true], errorCode: nil, errorMessage: nil)
            }
            return true
        }

        if action == "hotReload" {
            context.onHotReload(payload)
            if !requestId.isEmpty {
                responder.sendResponse(requestId: requestId, data: ["success": true], errorCode: nil, errorMessage: nil)
            }
            return true
        }

        if action == "log" {
            let level = payload["level"] as? String ?? "info"
            let message = payload["message"] as? String ?? ""
            print("[MiniAppConsole][\(level)] \(message)")
            return true
        }

        return false
    }

    private func dispatch(
        action: String,
        payload: [String: Any],
        requestId: String,
        context: BridgeRouteContext,
        responder: BridgeResponseSending
    ) {
        var routedPayload = payload
        routedPayload["appId"] = context.manifest.id

        pluginHost.execute(action: action, payload: routedPayload, bundlePath: context.bundlePath) { result in
            let permission = self.pluginHost.requiredPermission(forAction: action, payload: routedPayload)?.rawValue

            switch result {
            case .success(let data):
                if !requestId.isEmpty {
                    responder.sendResponse(requestId: requestId, data: data, errorCode: nil, errorMessage: nil)
                }
                BridgeAuditLogger.shared.logCall(
                    appId: context.manifest.id,
                    action: action,
                    permission: permission,
                    success: true
                )
            case .failure(let error):
                if !requestId.isEmpty {
                    responder.sendResponse(
                        requestId: requestId,
                        data: nil,
                        errorCode: "EXECUTION_ERROR",
                        errorMessage: error.localizedDescription
                    )
                }
                BridgeAuditLogger.shared.logCall(
                    appId: context.manifest.id,
                    action: action,
                    permission: permission,
                    success: false,
                    errorCode: "EXECUTION_ERROR",
                    errorMessage: error.localizedDescription
                )
            }
        }
    }

    private func reject(
        requestId: String,
        action: String,
        appId: String,
        code: String,
        message: String,
        responder: BridgeResponseSending
    ) {
        if !requestId.isEmpty {
            responder.sendResponse(requestId: requestId, data: nil, errorCode: code, errorMessage: message)
        }

        BridgeAuditLogger.shared.logCall(
            appId: appId,
            action: action,
            permission: nil,
            success: false,
            errorCode: code,
            errorMessage: message
        )
    }
}

final class PluginHost {
    static let shared = PluginHost(registry: .shared)

    private let registry: PluginRegistry

    init(registry: PluginRegistry) {
        self.registry = registry
    }

    func requiredPermission(forAction action: String, payload: [String: Any]) -> Permission? {
        BridgeACL.requiredPermission(forAction: action, payload: payload)
    }

    func rateLimitPolicy(forAction action: String, payload: [String: Any]) -> BridgeRateLimitPolicy? {
        registry.getDescriptor(forAction: action, payload: payload)?.rateLimit
    }

    func execute(
        action: String,
        payload: [String: Any],
        bundlePath: URL,
        completion: @escaping (Result<[String: Any]?, Error>) -> Void
    ) {
        registry.execute(action: action, payload: payload, bundlePath: bundlePath, completion: completion)
    }
}
