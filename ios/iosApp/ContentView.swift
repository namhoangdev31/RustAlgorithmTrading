import SwiftUI


struct ContentView: View {
    var body: some View {
        if #available(iOS 26.0, *) {
            ZStack {
                AppCoordinator()
            }
        } else {
            AppCoordinatorOld()
        }
    }
}
