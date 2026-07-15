import ExploreSwiftUI
import SwiftUI

struct QuantAntPortfolioView: View {
    let store: QuantAntPortfolioStore

    var body: some View {
        QuantAntStateView(state: store.state, retry: nil) {
            if let portfolio = store.portfolio {
                UniList {
                    Section("Account") {
                        LabeledContent("Equity", value: portfolio.equity.quantAntCurrency(portfolio.currency))
                        LabeledContent("Cash", value: portfolio.cash.quantAntCurrency(portfolio.currency))
                        LabeledContent("Buying power", value: portfolio.buyingPower.quantAntCurrency(portfolio.currency))
                        LabeledContent("Margin used", value: portfolio.marginUsed.quantAntCurrency(portfolio.currency))
                    }
                    Section("Performance") {
                        LabeledContent("Realized P&L", value: portfolio.realizedPnL.quantAntCurrency(portfolio.currency))
                        LabeledContent("Unrealized P&L", value: portfolio.unrealizedPnL.quantAntCurrency(portfolio.currency))
                    }
                    Section("Analytics") {
                        ContentUnavailableView(
                            "Equity curve & allocation",
                            systemImage: "chart.xyaxis.line",
                            description: Text("Available when portfolio snapshot history is enabled.")
                        )
                    }
                }
            }
        }
        .uniNavigationTitle("Portfolio")
    }
}
