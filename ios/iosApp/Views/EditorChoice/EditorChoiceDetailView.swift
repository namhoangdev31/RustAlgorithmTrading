import ExploreSwiftUI
import SFSafeSymbols
import SwiftUI

struct EditorChoiceDetailView: View {
    @EnvironmentObject var navigation: NavigationViewModel
    @State private var showStickyFooter: Bool = false
    @State private var offsetY: CGFloat = 0

    var body: some View {
        ZStack(alignment: .topTrailing) {
            UniScrollView {
                VStack(spacing: 0) {
                    EditorChoiceHeaderView()
                    EditorChoiceContentView()
                }
                .onCompatScrollOffsetChange { newValue in
                    offsetY = newValue
                    withAnimation {
                        showStickyFooter = newValue > 600
                    }
                }
            }
            .coordinateSpace(name: "scroll")
            .ignoresSafeArea(.container, edges: .top)

            if showStickyFooter {
                VStack {
                    Spacer()
                    HStack {
                        RoundedRectangle(cornerRadius: 12)
                            .frame(width: 50, height: 50)
                            .overlay(
                                Image(systemName: "flame.fill")
                                    .resizable()
                                    .aspectRatio(contentMode: .fit)
                                    .frame(height: 24)
                                    .foregroundColor(.orange)
                            )

                        VStack(alignment: .leading) {
                            Text("Crossfire Legends")
                                .font(.title3)
                                .uniForegroundStyle(.primary)
                            Text("Start your journey today.")
                                .font(.caption)
                                .uniForegroundStyle(.secondary)
                        }

                        Spacer()

                        UniButton(action: {}) {
                            Text("NHẬN")
                                .font(.subheadline)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                                .padding(.horizontal, 20)
                                .padding(.vertical, 8)
                                .background(Color.blue)
                                .cornerRadius(24)
                        }
                    }
                    .padding(.vertical)
                    .padding(.horizontal)
                    .background(.clear)
                    .uniGlass(cornerRadius: 16)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                }
                .padding(.vertical)
                .padding(.horizontal)
                .zIndex(1)
            }
        }
        .navigationBarBackButtonHidden(true)
        .toolbar {
            ToolbarItem {
                UniButton(action: {
                    navigation.goBack()
                }) {
                    Label("Account", systemImage: "multiply")
                }
            }
        }
    }
}
