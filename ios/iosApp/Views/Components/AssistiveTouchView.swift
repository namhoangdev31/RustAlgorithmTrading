import SwiftUI
import AdaptiveSwiftUi

struct AssistiveTouchView: View {
    @State private var dragPosition: CGPoint?
    @State private var isExpanded: Bool = false

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                if isExpanded {
                    // Transparent background to capture taps outside the menu
                    Color.black.opacity(0.001)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .onTapGesture {
                            withAnimation {
                                isExpanded = false
                            }
                        }

                    VStack(spacing: 20) {
                        Button(action: {
                            print("Menu Item 1 tapped")
                            withAnimation {
                                isExpanded = false
                            }
                        }) {
                                Image(systemName: "star.fill")
                                    .font(.title)
                                    .foregroundColor(.primary)
                                    .frame(width: 50, height: 50)
                                .adaptiveGlass(cornerRadius: 25)
                        }

                        Button(action: {
                            print("Menu Item 2 tapped")
                            withAnimation {
                                isExpanded = false
                            }
                        }) {
                                Image(systemName: "bell.fill")
                                    .font(.title)
                                    .foregroundColor(.primary)
                                    .frame(width: 50, height: 50)
                                .adaptiveGlass(cornerRadius: 25)
                        }

                        Button(action: {
                            print("Close tapped")
                            withAnimation {
                                isExpanded = false
                            }
                        }) {
                                Image(systemName: "xmark")
                                    .font(.title)
                                    .foregroundColor(.primary)
                                    .frame(width: 50, height: 50)
                                .adaptiveGlass(cornerRadius: 25)
                        }
                    }
                    .padding()
                    .adaptiveGlass(cornerRadius: 16)
                    .position(x: geometry.size.width / 2, y: geometry.size.height / 2)
                    .transition(.scale)
                    .zIndex(0)
                }

                if !isExpanded {
                    Button(action: {
                        withAnimation {
                            isExpanded.toggle()
                        }
                    }) {
                        Image(systemName: "circle.grid.3x3.fill")
                            .font(.system(size: 24))
                            .foregroundColor(.primary)
                            .frame(width: 60, height: 60)
                    }
                    .adaptiveGlass(cornerRadius: 100)
                    .position(dragPosition ?? CGPoint(x: geometry.size.width - 50, y: geometry.size.height - 150))
                    .highPriorityGesture(
                        DragGesture()
                        .onChanged { gesture in
                            self.dragPosition = gesture.location
                        }
                        .onEnded { value in
                            var currentPosition = value.location

                            if currentPosition.x > (geometry.size.width / 2) {
                                currentPosition.x = geometry.size.width - 40
                            } else {
                                currentPosition.x = 40
                            }

                            let minY: CGFloat = 80
                            let maxY: CGFloat = geometry.size.height - 80
                            currentPosition.y = min(max(currentPosition.y, minY), maxY)

                            withAnimation(.spring(response: 0.5, dampingFraction: 0.7)) {
                                dragPosition = currentPosition
                            }
                        }
                    )
                    .zIndex(1)
                }
            }
        }
    }
}
