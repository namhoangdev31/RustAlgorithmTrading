import SwiftUI

struct AboutAppView: View {
    var body: some View {
        List {
            Section {
                VStack(spacing: 16) {
                    Image(systemName: "app.dashed") // App Icon placeholder
                        .resizable()
                        .scaledToFit()
                        .frame(width: 80, height: 80)
                        .foregroundColor(.blue)
                    
                    Text("Lepos App")
                        .font(.title2)
                        .fontWeight(.bold)
                    
                    Text("Version 1.0.0 (Build 100)")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical)
            }
            .listRowBackground(Color.clear)
            
            Section(header: Text("Legal")) {
                NavigationLink("Terms of Service", value: AppRoute.legal(type: "terms"))
                NavigationLink("Privacy Policy", value: AppRoute.legal(type: "privacy"))
                NavigationLink("Licenses", value: AppRoute.legal(type: "licenses"))
            }
            
            Section {
                Text("Made with ❤️ by the Lepos Team")
                    .frame(maxWidth: .infinity, alignment: .center)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .listRowBackground(Color.clear)
        }
        .navigationTitle("About")
        .navigationBarTitleDisplayMode(.inline)
    }
}
