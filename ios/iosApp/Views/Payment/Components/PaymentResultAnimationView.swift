import SwiftUI

struct PaymentResultAnimationView: View {
    let type: PaymentResultType
    
    var body: some View {
        ZStack {
            Circle()
                .fill(Color.white)
                .frame(width: 120, height: 120)
                .shadow(color: type == .success ? .green.opacity(0.3) : .red.opacity(0.3), radius: 20, x: 0, y: 10)
            
            Circle()
                .fill(type == .success ? Color.green : Color.red)
                .frame(width: 80, height: 80)
            
            Image(systemName: type == .success ? "checkmark" : "xmark")
                .font(.system(size: 40, weight: .bold))
                .foregroundColor(.white)
        }
        .padding(.top, 40)
    }
}
