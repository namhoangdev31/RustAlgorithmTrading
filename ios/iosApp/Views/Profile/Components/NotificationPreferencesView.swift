import SwiftUI
import AdaptiveSwiftUi


struct NotificationPreferencesView: View {
    @State private var notifyUpdates = true
    @State private var notifyRecommendations = true
    @State private var notifyOffers = false
    @State private var notifySecurity = true
    
    var body: some View {
        AdaptiveList {
            Section(header: Text("App Activity")) {
                Toggle("App Updates", isOn: $notifyUpdates)
                Toggle("Recommendations", isOn: $notifyRecommendations)
            }
            
            Section(header: Text("Promotions")) {
                Toggle("Special Offers", isOn: $notifyOffers)
            }
            
            Section(header: Text("Account")) {
                Toggle("Security Alerts", isOn: $notifySecurity)
            }
            
            Section(footer: Text("Push notifications allow you to verify your identity and get urgent alerts.")) {
                // Info footer
            }
        }
        .navigationTitle("Notifications")
    }
}
