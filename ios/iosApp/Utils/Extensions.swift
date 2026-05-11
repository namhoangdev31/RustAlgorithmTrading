import SwiftUI

extension View {
    func cardStyle() -> some View {
        self.padding()
            .background(Color.white)
            .cornerRadius(10)
            .shadow(radius: 5)
    }
}

extension Color {
    static let primaryBrand = Color("PrimaryBrand") // Assumes Asset name
}
