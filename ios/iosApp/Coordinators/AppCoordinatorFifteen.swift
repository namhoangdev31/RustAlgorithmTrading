//
// Created by Hoàng Nam on 11/3/26.
//

import Foundation
import SwiftUI

@available(iOS 15.0, *)
struct AppCoordinatorFifteen: View {
    @StateObject private var navigation = NavigationViewModel()
    @AppStorage("isLoggedIn") var isLoggedIn: Bool = false
    @AppStorage("hasSeenOnboarding") var hasSeenOnboarding: Bool = false
    @Environment(\.appContainer) private var container

    var body: some View {
        Group {
            if !hasSeenOnboarding {
                OnboardingView(isCompleted: $hasSeenOnboarding)
            } else {
                NavigationStack(path: $navigation.path){

                }
            }
        }
    }
}
