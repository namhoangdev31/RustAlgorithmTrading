import SwiftUI

public struct BrowserProxySettingsView: View {
    @ObservedObject var viewModel: BrowserViewModel
    @Environment(\.dismiss) var dismiss
    
    @State private var host: String = ""
    @State private var portString: String = ""
    @State private var selectedType: BrowserProxyConfig.ProxyType = .socks5
    @State private var errorMessage: String? = nil
    
    public var body: some View {
        NavigationStack {
            Form {
                Section(header: Text("Thông tin máy chủ Proxy")) {
                    Picker("Loại Proxy", selection: $selectedType) {
                        ForEach(BrowserProxyConfig.ProxyType.allCases) { type in
                            Text(type.rawValue).tag(type)
                        }
                    }
                    .pickerStyle(.segmented)
                    
                    HStack {
                        Text("Địa chỉ (Host)")
                            .foregroundColor(.secondary)
                        Spacer()
                        TextField("e.g. 192.168.1.1 hoặc proxy.com", text: $host)
                            .multilineTextAlignment(.trailing)
                            .autocorrectionDisabled()
                            .autocapitalization(.none)
                    }
                    
                    HStack {
                        Text("Cổng (Port)")
                            .foregroundColor(.secondary)
                        Spacer()
                        TextField("e.g. 8080", text: $portString)
                            .multilineTextAlignment(.trailing)
                            .keyboardType(.numberPad)
                    }
                }
                
                if let errorMessage {
                    Section {
                        Text(errorMessage)
                            .foregroundColor(.red)
                            .font(.system(size: 13, weight: .medium))
                    }
                }
                
                Section {
                    Button(action: saveConfig) {
                        Text("Lưu cấu hình")
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                            .foregroundColor(.white)
                    }
                    .listRowBackground(Color.blue)
                }
            }
            .navigationTitle("Cấu hình Proxy")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Hủy") {
                        dismiss()
                    }
                }
            }
            .onAppear {
                if let config = viewModel.proxyConfig {
                    host = config.host
                    portString = String(config.port)
                    selectedType = config.type
                }
            }
        }
    }
    
    private func saveConfig() {
        errorMessage = nil
        let trimmedHost = host.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedHost.isEmpty else {
            errorMessage = "Vui lòng nhập Địa chỉ (Host)."
            return
        }
        
        let trimmedPort = portString.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let portNum = UInt16(trimmedPort), portNum > 0 else {
            errorMessage = "Cổng (Port) phải là số từ 1 - 65535."
            return
        }
        
        let config = BrowserProxyConfig(host: trimmedHost, port: portNum, type: selectedType)
        viewModel.proxyConfig = config
        dismiss()
    }
}
