/**
 * LepoShip WebView SDK
 * Enables communication between your web application and the native LepoShip shell container.
 */

// Global callback registry for responses from Native shell
if (typeof window !== "undefined" && !window.__lepoShipCallbacks) {
  window.__lepoShipCallbacks = new Map();
  
  // Register the global response handler that native code will call
  window.__lepoShipReceiveMessage = function(requestId, response) {
    const callback = window.__lepoShipCallbacks.get(requestId);
    if (callback) {
      if (response.error) {
        callback.reject(new Error(response.error));
      } else {
        callback.resolve(response.data);
      }
      window.__lepoShipCallbacks.delete(requestId);
    }
  };
}

class LepoShipBridge {
  constructor() {
    this.isIOS = typeof window !== "undefined" && 
      window.webkit && 
      window.webkit.messageHandlers && 
      window.webkit.messageHandlers.lepoShipBridge;
      
    this.isAndroid = typeof window !== "undefined" && 
      window.LepoShipBridge;
  }

  /**
   * Send a request message to the Native container
   * @param {string} action 
   * @param {any} payload 
   * @returns {Promise<any>}
   */
  send(action, payload = {}) {
    return new Promise((resolve, reject) => {
      const requestId = Math.random().toString(36).substring(2, 15);
      
      if (typeof window !== "undefined") {
        window.__lepoShipCallbacks.set(requestId, { resolve, reject });
      }

      const message = {
        requestId,
        action,
        payload
      };

      if (this.isIOS) {
        window.webkit.messageHandlers.lepoShipBridge.postMessage(message);
      } else if (this.isAndroid) {
        window.LepoShipBridge.postMessage(JSON.stringify(message));
      } else {
        // Fallback for development browser testing
        console.warn(`[LepoShip WebBridge] Native environment not detected. Action '${action}' simulated.`);
        setTimeout(() => {
          this._handleMockResponse(requestId, action, payload);
        }, 300);
      }
    });
  }

  // Simulated native handlers for web browser dev
  _handleMockResponse(requestId, action, payload) {
    if (typeof window === "undefined") return;

    let responseData = {};
    switch (action) {
      case "getCameraPhoto":
        responseData = { uri: "https://via.placeholder.com/600x400.png?text=MockCameraPhoto" };
        break;
      case "getLocation":
        responseData = { latitude: 21.0285, longitude: 105.8542, accuracy: 10 }; // Hanoi coords
        break;
      case "getDeviceInfo":
        responseData = { platform: "browser", manufacturer: "Google", osVersion: "Chrome" };
        break;
      case "getBiometrics":
        responseData = { success: true };
        break;
      default:
        responseData = { success: true, payload };
    }
    
    window.__lepoShipReceiveMessage(requestId, { data: responseData });
  }

  // Wrapper SDK Methods
  getCameraPhoto() {
    return this.send("getCameraPhoto");
  }

  getLocation() {
    return this.send("getLocation");
  }

  getDeviceInfo() {
    return this.send("getDeviceInfo");
  }

  authenticateBiometrics() {
    return this.send("getBiometrics");
  }
}

export const webviewSdk = new LepoShipBridge();
export default webviewSdk;
