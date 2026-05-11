import SwiftUI
// import Shared — replaced by native Swift Shared module

struct WalletViewOld: View {
    @EnvironmentObject var navigation: NavigationViewModel
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Main Balance Card
                WalletBalanceCardOld()
                    .padding(.horizontal)
                
                // Points and Status Grid
                HStack(spacing: 16) {
                    WalletPointsCardOld()
                    WalletMemberStatusCardOld()
                }
                .padding(.horizontal)
                
                // Quick Services
                WalletQuickServicesViewOld()
                
                // Exclusive Offer
                WalletExclusiveOfferViewOld()
                    .padding(.horizontal)
                
                Spacer(minLength: 40)
            }
            .padding(.top)
        }
        .navigationTitle("Wallet")
        .navigationBarTitleDisplayMode(.inline)
    }
}
