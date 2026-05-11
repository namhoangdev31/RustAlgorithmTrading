import SwiftUI

struct LegalView: View {
    let type: String // "terms" or "privacy" or "licenses"
    
    var title: String {
        switch type {
        case "terms": return "Terms of Service"
        case "privacy": return "Privacy Policy"
        case "licenses": return "Licenses"
        default: return "Legal"
        }
    }
    
    var content: String {
        switch type {
        case "terms":
            return """
            Terms of Service
            
            1. Acceptance of Terms
            By accessing and using this application, you accept and agree to be bound by the terms and provision of this agreement.
            
            2. Use License
            Permission is granted to temporarily download one copy of the materials (information or software) on Lepos App for personal, non-commercial transitory viewing only.
            
            3. Disclaimer
            The materials on Lepos App are provided "as is". Lepos makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties.
            """
        case "privacy":
            return """
            Privacy Policy
            
            1. Information Collection
            We collect information from you when you register on our site, place an order, subscribe to a newsletter or enter information on our site.
            
            2. Use of Information
            Any of the information we collect from you may be used to personalize your experience, improve our website, improve customer service, or process transactions.
            
            3. Data Protection
            We implement a variety of security measures to maintain the safety of your personal information.
            """
        case "licenses":
            return """
            Open Source Licenses
            
            - SwiftUI
            - Jetpack Compose
            - Kotlin Standard Library
            - Swift Standard Library
            """
        default:
            return "Content not found."
        }
    }
    
    var body: some View {
        ScrollView {
            Text(content)
                .padding()
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .navigationTitle(title)
        .navigationBarTitleDisplayMode(.inline)
    }
}
