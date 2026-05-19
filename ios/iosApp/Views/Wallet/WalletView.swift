import ExploreSwiftUI
import SwiftUI

// import Shared — replaced by native Swift Shared module

struct WalletView: View {
    @EnvironmentObject var navigation: NavigationViewModel

    var body: some View {
        UniScrollView {
            VStack(spacing: 24) {
                // Main Balance Card
                WalletBalanceCard()
                    .padding(.horizontal)

                // Points and Status Grid
                HStack(spacing: 16) {
                    WalletPointsCard()
                    WalletMemberStatusCard()
                }
                .padding(.horizontal)

                // Quick Services
                WalletQuickServicesView()

                // Exclusive Offer
                WalletExclusiveOfferView()
                    .padding(.horizontal)

                Spacer(minLength: 40)
            }
            .padding(.top)
        }
        .navigationTitle("Wallet")
        .navigationBarTitleDisplayMode(.inline)
    }
}
