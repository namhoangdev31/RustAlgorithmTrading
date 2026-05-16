import SwiftUI
import AdaptiveSwiftUi


struct SavedMethodRow: View {
    let method: PaymentMethod
    
    var body: some View {
        HStack(spacing: 16) {
            // Icon
            ZStack {
                RoundedRectangle(cornerRadius: 16)
                    .fill(bgForMethod(method))
                    .frame(width: 56, height: 56)
                
                iconForMethod(method)
                    .font(.system(size: 24))
            }
            
            // Text
            VStack(alignment: .leading, spacing: 4) {
                Text(titleForMethod(method))
                    .font(.system(size: 16, weight: .bold))
                    .adaptiveForegroundStyle(.primary)
                
                // Subtitle (dots)
                HStack(spacing: 4) {
                    if case .bank(let bankName, _, _) = method {
                         Text(bankName)
                            .font(.subheadline)
                            .adaptiveForegroundStyle(.secondary)
                    } 
                    
                    HStack(spacing: 3) {
                         ForEach(0..<4) { _ in
                             Circle()
                                 .fill(Color.gray.opacity(0.7))
                                 .frame(width: 4, height: 4)
                                 .adaptiveForegroundStyle(.secondary, opacity: 0.7)
                         }
                    }
                    .padding(.horizontal, 2)
                    
                    Text(last4ForMethod(method))
                        .font(.subheadline)
                        .adaptiveForegroundStyle(.secondary)
                }
            }
            
            Spacer()
            
            AdaptiveButton(action: {}) {
                Image(systemName: "ellipsis")
                    .rotationEffect(.degrees(90))
                    .adaptiveForegroundStyle(.secondary)
                    .font(.system(size: 16, weight: .semibold))
                    .padding(8)
            }
            .adaptiveButtonStyle(.plain)
        }
        .padding(20)
        .adaptiveGlass(cornerRadius: 28)
        .padding(.horizontal)
    }
    
    func bgForMethod(_ method: PaymentMethod) -> Color {
        switch method {
        case .visa: return Color(red: 0.9, green: 0.92, blue: 0.98) // Light Blue
        case .mastercard: return Color(red: 1.0, green: 0.9, blue: 0.9) // Light Red
        case .bank: return Color(red: 0.9, green: 0.98, blue: 0.92) // Light Green
        default: return .gray
        }
    }
    
    // Using SF Symbols or colors to mimic icons
    @ViewBuilder
    func iconForMethod(_ method: PaymentMethod) -> some View {
        switch method {
        case .visa:
            Image(systemName: "creditcard.fill")
                .foregroundColor(.blue)
        case .mastercard:
            Image(systemName: "creditcard.fill")
                .foregroundColor(.red)
        case .bank:
             Image(systemName: "building.columns.fill")
                .adaptiveForegroundStyle(.green)
        default:
            EmptyView()
        }
    }
    
    func titleForMethod(_ method: PaymentMethod) -> String {
        switch method {
        case .visa: return "Visa Platinum"
        case .mastercard: return "Mastercard World"
        case .bank(let name, _, _): return name
        default: return ""
        }
    }
    
    func last4ForMethod(_ method: PaymentMethod) -> String {
         switch method {
        case .visa(let last4): return last4
        case .mastercard(let last4): return last4
        case .bank(_, _, let last4): return last4
        default: return ""
        }
    }
}
