import SwiftUI

struct CheckoutPaymentMethodCard<Content: View>: View {
    let isSelected: Bool
    let content: Content
    
    init(isSelected: Bool, @ViewBuilder content: () -> Content) {
        self.isSelected = isSelected
        self.content = content()
    }
    
    var body: some View {
        ZStack(alignment: .topTrailing) {
            content
                .padding(16)
                .frame(width: 140, height: 100, alignment: .leading)
                .background(isSelected ? Color.cyan.opacity(0.1) : Color.white)
                .cornerRadius(16)
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(isSelected ? Color.cyan : Color.clear, lineWidth: 2)
                )
            
            if isSelected {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(.cyan)
                    .padding(8)
            }
        }
    }
}
