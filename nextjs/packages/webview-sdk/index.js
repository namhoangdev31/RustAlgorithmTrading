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
      (window.webkit.messageHandlers.lepoShipBridge || window.webkit.messageHandlers.LeposBridge);
      
    this.isAndroid = typeof window !== "undefined" && 
      (window.LepoShipBridge || window.LeposBridge);

    this.isFlutter = typeof window !== "undefined" && 
      (!!window.flutter_inappwebview || !!window.LepoShipBridgeFlutter);

    this.isExpo = typeof window !== "undefined" && 
      !!window.ReactNativeWebView;

    this.isWebIframe = typeof window !== "undefined" && 
      window.parent !== window;

    this.plugins = new Map();
    this.grantedPermissions = new Set();

    // Auto-initialize crash tracker and load plugins in browser environment
    if (typeof window !== "undefined") {
      // Register global message listener for PostMessage events (Expo & Web Iframe)
      window.addEventListener("message", (event) => {
        let data = event.data;
        if (typeof data === "string") {
          try {
            data = JSON.parse(data);
          } catch (e) {
            return;
          }
        }
        if (data && data.type === "lepoShipResponse" && data.requestId) {
          window.__lepoShipReceiveMessage(data.requestId, data.response || data);
        }
      });

      const urlParams = new URLSearchParams(window.location.search);
      const currentVersion = urlParams.get("appVersion") || urlParams.get("version") || "1.0.0";
      this.initCrashTracker(currentVersion);
      
      // Auto-load installed plugins
      this.initPlugins();
    }
  }

  /**
   * Automatically fetch and load installed plugins from the native container.
   */
  async initPlugins() {
    try {
      console.log("[LepoShip SDK] Initializing plugins...");
      const plugins = await this.send("getInstalledPlugins");
      if (Array.isArray(plugins)) {
        for (const plugin of plugins) {
          if (plugin.bundleUrl) {
            console.log(`[LepoShip SDK] Loading plugin: ${plugin.name} (${plugin.version}) from ${plugin.bundleUrl}`);
            await this.loadPluginScript(plugin.bundleUrl).catch((err) => {
              console.error(`[LepoShip SDK] Failed to load plugin script for ${plugin.name}:`, err);
            });
          }
        }
      }
    } catch (e) {
      console.error("[LepoShip SDK] Failed to initialize plugins:", e);
    }
  }

  /**
   * Initialize the crash tracker. Compares current loading version to history.
   * Increments crash count if the previous load never succeeded (remained in 'loading' state).
   */
  initCrashTracker(currentVersion) {
    if (typeof window === "undefined" || !window.localStorage) return;

    try {
      const lastVersion = localStorage.getItem("lepoship_last_version");
      const loadStatus = localStorage.getItem("lepoship_load_status");
      let crashCount = parseInt(localStorage.getItem("lepoship_crash_count") || "0", 10);

      if (lastVersion === currentVersion) {
        if (loadStatus === "loading") {
          crashCount += 1;
          localStorage.setItem("lepoship_crash_count", crashCount.toString());
          console.warn(`[LepoShip SDK] App load failure detected. Consecutive crash count: ${crashCount}`);
        }
      } else {
        crashCount = 0;
        localStorage.setItem("lepoship_crash_count", "0");
        localStorage.setItem("lepoship_last_version", currentVersion);
      }

      localStorage.setItem("lepoship_load_status", "loading");

      if (crashCount >= 3) {
        console.error(`[LepoShip SDK] Emergency! ${crashCount} consecutive crashes detected on version ${currentVersion}. Triggering rollback.`);
        this.triggerEmergencyRollback(currentVersion, crashCount);
      } else {
        // Automatically mark as loaded successfully after 4 seconds fallback
        this.appReadyTimeout = setTimeout(() => {
          this.reportAppReady();
        }, 4000);
      }
    } catch (e) {
      console.error("[LepoShip SDK] Failed to execute crash tracker", e);
    }
  }

  /**
   * Resets crash count once the app successfully loads and becomes interactive.
   */
  reportAppReady() {
    if (typeof window === "undefined" || !window.localStorage) return;
    if (this.appReadyTimeout) {
      clearTimeout(this.appReadyTimeout);
    }
    try {
      localStorage.setItem("lepoship_load_status", "success");
      localStorage.setItem("lepoship_crash_count", "0");
      console.log("[LepoShip SDK] App loaded successfully. Crash tracker reset.");
    } catch (e) {}
  }

  /**
   * Dispatches emergency rollback calls to both native shell and LepoS web server.
   */
  async triggerEmergencyRollback(failedVersion, crashCount) {
    // 1. Send emergency rollback message to native container
    this.send("emergency_rollback", { failedVersion, crashCount }).catch(() => {});

    // 2. Call automatic rollback API on the LepoS web console
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const projectId = urlParams.get("projectId");
      if (projectId) {
        try {
          const response = await fetch(`/api/bundles/rollback`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ 
              projectId, 
              failedVersion, 
              reason: `Emergency rollback: ${crashCount} consecutive crashes` 
            }),
          });
          const res = await response.json();
          if (res.success) {
            console.log(`[LepoShip SDK] Auto-rollback triggered. Reverted to stable version: ${res.rolledBackTo}`);
            // Inform native container to check and fetch the stable updates
            this.send("reload_bundle").catch(() => {});
          }
        } catch (err) {
          console.error("[LepoShip SDK] Auto-rollback call failed:", err);
        }
      }
    }
  }

  /**
   * Send a request message to the Native container
   * @param {string} action 
   * @param {any} payload 
   * @returns {Promise<any>}
   */
  async send(action, payload = {}) {
    const permissionMap = {
      "camera.takePhoto": "camera",
      "getCameraPhoto": "camera",
      "location.getCurrent": "location",
      "getLocation": "location",
      "getBiometrics": "biometrics"
    };

    const requiredPermission = permissionMap[action];
    if (requiredPermission) {
      const isGranted = await this.verifyPermission(requiredPermission);
      if (!isGranted) {
        throw new Error(`Permission denied for: ${requiredPermission}`);
      }
    }

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
        const handler = window.webkit.messageHandlers.lepoShipBridge || window.webkit.messageHandlers.LeposBridge;
        handler.postMessage(message);
      } else if (this.isAndroid && !this.isFlutter) {
        const bridge = window.LepoShipBridge || window.LeposBridge;
        bridge.postMessage(JSON.stringify(message));
      } else if (this.isFlutter) {
        if (window.flutter_inappwebview) {
          window.flutter_inappwebview.callHandler('lepoShipBridge', JSON.stringify(message))
            .then((res) => {
              const parsed = typeof res === "string" ? JSON.parse(res) : res;
              window.__lepoShipReceiveMessage(requestId, parsed || { data: res });
            })
            .catch((err) => {
              window.__lepoShipReceiveMessage(requestId, { error: err.message || err });
            });
        } else if (window.LepoShipBridgeFlutter) {
          window.LepoShipBridgeFlutter.postMessage(JSON.stringify(message));
        } else {
          window.postMessage(JSON.stringify(message), "*");
        }
      } else if (this.isExpo) {
        window.ReactNativeWebView.postMessage(JSON.stringify(message));
      } else if (this.isWebIframe) {
        window.parent.postMessage({ type: "lepoShipRequest", ...message }, "*");
      } else {
        // Fallback for development browser testing
        console.warn(`[LepoShip WebBridge] Native environment not detected. Action '${action}' simulated.`);
        setTimeout(() => {
          this._handleMockResponse(requestId, action, payload);
        }, 300);
      }
    });
  }

  async verifyPermission(permission) {
    if (this.grantedPermissions.has(permission)) {
      return true;
    }

    if (typeof document === "undefined") return true;
    this.injectPromptStyles();

    return new Promise((resolve) => {
      const modal = document.createElement("div");
      modal.className = "lepos-permission-modal";
      modal.innerHTML = `
        <div class="lepos-permission-card animate-in">
          <div class="lepos-permission-header">
            <span class="lepos-shield-icon">🛡️</span>
            <h3>Permission Request</h3>
          </div>
          <p>This application is requesting permission to access your <strong>${permission}</strong>.</p>
          <div class="lepos-permission-actions">
            <button class="lepos-btn lepos-btn-deny">Deny</button>
            <button class="lepos-btn lepos-btn-allow">Allow</button>
          </div>
        </div>
      `;
      
      modal.querySelector(".lepos-btn-allow").addEventListener("click", () => {
        this.grantedPermissions.add(permission);
        document.body.removeChild(modal);
        resolve(true);
      });
      
      modal.querySelector(".lepos-btn-deny").addEventListener("click", () => {
        document.body.removeChild(modal);
        resolve(false);
      });
      
      document.body.appendChild(modal);
    });
  }

  injectPromptStyles() {
    if (document.getElementById("lepos-prompt-styles")) return;
    const style = document.createElement("style");
    style.id = "lepos-prompt-styles";
    style.innerHTML = `
      .lepos-permission-modal {
        position: fixed;
        inset: 0;
        z-index: 10000;
        background: rgba(0,0,0,0.6);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: system-ui, -apple-system, sans-serif;
      }
      .lepos-permission-card {
        background: #09090b;
        color: #f4f4f5;
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 20px;
        padding: 24px;
        max-width: 320px;
        width: 90%;
        box-shadow: 0 20px 40px rgba(0,0,0,0.5);
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .lepos-permission-header {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .lepos-shield-icon {
        font-size: 24px;
      }
      .lepos-permission-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 700;
        color: #fff;
      }
      .lepos-permission-card p {
        margin: 0;
        font-size: 13px;
        color: #a1a1aa;
        line-height: 1.6;
      }
      .lepos-permission-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        margin-top: 4px;
      }
      .lepos-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }
      .lepos-btn-allow {
        background: #4f46e5;
        color: white;
      }
      .lepos-btn-allow:hover {
        background: #4338ca;
      }
      .lepos-btn-deny {
        background: rgba(255,255,255,0.03);
        color: #a1a1aa;
        border: 1px solid rgba(255,255,255,0.08);
      }
      .lepos-btn-deny:hover {
        background: rgba(255,255,255,0.08);
        color: #f4f4f5;
      }
      @keyframes animateIn {
        from { opacity: 0; transform: scale(0.95) translateY(10px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
      .animate-in {
        animation: animateIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
    `;
    document.head.appendChild(style);
  }

  // Simulated native handlers for web browser dev
  _handleMockResponse(requestId, action, payload) {
    if (typeof window === "undefined") return;

    let responseData = {};
    switch (action) {
      case "getInstalledPlugins":
        responseData = [
          {
            id: "camera-plugin-id",
            slug: "camera",
            name: "Camera Plugin",
            version: "1.0.0",
            bundleUrl: "https://cdn.lepos.dev/plugins/camera.js",
            permissions: ["camera"],
          },
          {
            id: "location-plugin-id",
            slug: "location",
            name: "Location Plugin",
            version: "1.0.0",
            bundleUrl: "https://cdn.lepos.dev/plugins/location.js",
            permissions: ["location"],
          }
        ];
        break;
      case "camera.takePhoto":
      case "getCameraPhoto":
        responseData = { uri: "https://via.placeholder.com/600x400.png?text=MockCameraPhoto" };
        break;
      case "plugin.invoke":
        responseData = { success: true, plugin: payload.plugin, method: payload.method, result: payload.args || {} };
        break;
      case "debug.log":
        responseData = { success: true };
        break;
      case "location.getCurrent":
      case "getLocation":
        responseData = { latitude: 21.0285, longitude: 105.8542, accuracy: 10 }; // Hanoi coords
        break;
      case "device.getInfo":
      case "getDeviceInfo":
        responseData = { platform: "browser", manufacturer: "Google", osVersion: "Chrome" };
        break;
      case "getBiometrics":
        responseData = { success: true };
        break;
      case "emergency_rollback":
        responseData = { success: true };
        break;
      case "reload_bundle":
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

  registerPlugin(plugin) {
    if (!plugin || !plugin.name) {
      throw new Error("Plugin must include a name.");
    }
    this.plugins.set(plugin.name, plugin);
    return plugin;
  }

  invokePlugin(plugin, method, args = {}) {
    return this.send("plugin.invoke", { plugin, method, args });
  }

  loadPluginScript(url) {
    if (typeof document === "undefined") {
      return Promise.resolve(false);
    }

    return new Promise((resolve, reject) => {
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.sandbox = "allow-scripts"; // Secure Sandbox
      
      iframe.srcdoc = `
        <!DOCTYPE html>
        <html>
        <head>
          <script>
            window.addEventListener('message', async (e) => {
              if (e.data && e.data.type === 'execute') {
                try {
                  // Execute dynamic plugin code in a fully sandboxed isolated context
                  const result = eval(e.data.code);
                  window.parent.postMessage({ type: 'result', id: e.data.id, data: result }, '*');
                } catch (err) {
                  window.parent.postMessage({ type: 'result', id: e.data.id, error: err.message }, '*');
                }
              }
            });
          </script>
        </head>
        <body></body>
        </html>
      `;

      iframe.onload = () => {
        fetch(url)
          .then(res => res.text())
          .then(code => {
            const executionId = Math.random().toString(36).substring(7);
            const messageHandler = (e) => {
              if (e.data && e.data.type === 'result' && e.data.id === executionId) {
                window.removeEventListener('message', messageHandler);
                if (e.data.error) {
                  reject(new Error(e.data.error));
                } else {
                  resolve(true);
                }
              }
            };
            window.addEventListener('message', messageHandler);
            iframe.contentWindow.postMessage({ type: 'execute', id: executionId, code }, '*');
          })
          .catch(err => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
            reject(err);
          });
      };

      document.body.appendChild(iframe);
    });
  }

  enableDebugStreaming() {
    if (typeof console === "undefined" || console.__lepoShipDebugPatched) {
      return;
    }

    // Attempt to pipe logs directly to the local dev emulator WebSocket server
    let debugWs = null;
    if (typeof window !== "undefined") {
      try {
        const port = 3410;
        debugWs = new WebSocket(`ws://localhost:${port}/lepos/debug-ws`);
        debugWs.onerror = () => {}; // Suppress local dev errors in production
      } catch (err) {}
    }

    const levels = ["log", "warn", "error"];
    levels.forEach((level) => {
      const original = console[level].bind(console);
      console[level] = (...args) => {
        const message = args.map(String).join(" ");
        this.send("debug.log", {
          level,
          message,
          timestamp: new Date().toISOString(),
        }).catch(() => {});
        
        // Also pipe directly through websocket if active
        if (debugWs && debugWs.readyState === 1 /* OPEN */) {
          debugWs.send(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: level === "log" ? "info" : level,
            message
          }));
        }

        original(...args);
      };
    });
    console.__lepoShipDebugPatched = true;
  }
}

export const webviewSdk = new LepoShipBridge();
export const cameraPlugin = {
  takePhoto(options = {}) {
    return webviewSdk.send("camera.takePhoto", options);
  },
};
export default webviewSdk;
