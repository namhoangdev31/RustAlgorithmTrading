import Foundation

enum PaymentMethod: Identifiable {
    case applePay
    case visa(last4: String)
    case mastercard(last4: String)
    case bank(name: String, bankName: String, last4: String)
    
    var id: String {
        switch self {
        case .applePay: return "apple_pay"
        case .visa(let last4): return "visa_\(last4)"
        case .mastercard(let last4): return "mastercard_\(last4)"
        case .bank(_, _, let last4): return "bank_\(last4)"
        }
    }
}
