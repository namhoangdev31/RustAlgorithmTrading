import Foundation

extension String {
    func quantAntCurrency(_ currency: String = "USD") -> String {
        guard let value = Decimal(string: self) else { return self }
        return value.formatted(.currency(code: currency))
    }
}

