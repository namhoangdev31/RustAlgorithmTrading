import Foundation
import CoreLocation

/// GPS Location plugin querying dynamic device coordinates using CLLocationManager
final class LocationPlugin: NSObject, RuntimePlugin, CLLocationManagerDelegate, @unchecked Sendable {
    var descriptor: PluginDescriptor {
        return PluginDescriptor(
            action: "location.getCurrent",
            permission: .location,
            policy: .protected
        ) { [weak self] action, payload, bundlePath, completion in
            guard let self = self else { return }
            Task {
                let response = await self.handle(BridgeRequest(
                    appId: "",
                    action: action,
                    payload: payload,
                    bundlePath: bundlePath
                ))
                if response.success {
                    completion(.success(response.data))
                } else {
                    completion(.failure(NSError(
                        domain: "LocationPlugin",
                        code: 400,
                        userInfo: [NSLocalizedDescriptionKey: response.errorMessage ?? "Error"]
                    )))
                }
            }
        }
    }
    
    private var locationManager: CLLocationManager?
    private var locationContinuation: CheckedContinuation<BridgeResponse, Never>?
    
    func handle(_ request: BridgeRequest) async -> BridgeResponse {
        return await withCheckedContinuation { continuation in
            DispatchQueue.main.async { [weak self] in
                guard let self = self else {
                    continuation.resume(returning: .failure(code: "DEALLOCATED", message: "Plugin deallocated."))
                    return
                }
                
                let manager = CLLocationManager()
                manager.delegate = self
                self.locationManager = manager
                self.locationContinuation = continuation
                
                let status = manager.authorizationStatus
                if status == .notDetermined {
                    manager.requestWhenInUseAuthorization()
                } else if status == .denied || status == .restricted {
                    continuation.resume(returning: .failure(code: "LOCATION_DISABLED", message: "Location services are disabled."))
                    self.locationContinuation = nil
                } else {
                    manager.requestLocation()
                }
            }
        }
    }
    
    // MARK: - CLLocationManagerDelegate
    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        let status = manager.authorizationStatus
        if status == .authorizedWhenInUse || status == .authorizedAlways {
            manager.requestLocation()
        } else if status == .denied || status == .restricted {
            locationContinuation?.resume(returning: .failure(code: "LOCATION_DENIED", message: "Location authorization was denied."))
            locationContinuation = nil
        }
    }
    
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.first else {
            locationContinuation?.resume(returning: .failure(code: "NO_GPS_LOCK", message: "Failed to acquire location lock."))
            locationContinuation = nil
            return
        }
        
        let coords: [String: Any] = [
            "latitude": location.coordinate.latitude,
            "longitude": location.coordinate.longitude,
            "altitude": location.altitude,
            "accuracy": location.horizontalAccuracy,
            "timestamp": location.timestamp.timeIntervalSince1970
        ]
        
        locationContinuation?.resume(returning: .success(coords))
        locationContinuation = nil
    }
    
    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        locationContinuation?.resume(returning: .failure(code: "LOCATION_ERROR", message: error.localizedDescription))
        locationContinuation = nil
    }
}
