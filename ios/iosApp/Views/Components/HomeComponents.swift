import ACarousel
import ExploreSwiftUI
import SwiftUI

// MARK: - Model

struct CarouselItem: Identifiable, Hashable {
    let id: String
    let title: String
    let colors: [Color]
}

// MARK: - Data mẫu

let carouselItems: [CarouselItem] = [
    .init(id: "Luffy", title: "Luffy", colors: [.red, .orange]),
    .init(id: "Zoro", title: "Zoro", colors: [.green, .black]),
    .init(id: "Sanji", title: "Sanji", colors: [.yellow, .orange]),
    .init(id: "Nami", title: "Nami", colors: [.blue, .cyan]),
    .init(id: "Usopp", title: "Usopp", colors: [.brown, .green]),
    .init(id: "Chopper", title: "Chopper", colors: [.pink, .red]),
    .init(id: "Robin", title: "Robin", colors: [.purple, .indigo]),
    .init(id: "Franky", title: "Franky", colors: [.teal, .blue]),
    .init(id: "Brook", title: "Brook", colors: [.gray, .black]),
]

struct LeposCarousel: View {

    var body: some View {
        ACarousel(
            carouselItems,
            id: \.id, spacing: 20,
            headspace: 10,
            sidesScaling: 0.5,
            isWrap: true,
            autoScroll: .active(15)
        ) { item in
            carouselItem(item)
        }
        .frame(height: 175)
    }

    // MARK: - Item UI

    private func carouselItem(
        _ item: CarouselItem,
    ) -> some View {
        ZStack(alignment: .bottomLeading) {

            LinearGradient(
                colors: item.colors,
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            VStack(alignment: .leading, spacing: 8) {
                Image(systemName: "person.fill")
                    .font(.largeTitle)
                    .uniForegroundStyle(.white, opacity: 0.9)

                Text(item.title)
                    .font(.title.bold())
                    .uniForegroundStyle(.white)
            }
            .padding()
        }
        .frame(height: 175)
        .uniGlass(cornerRadius: 30)
    }
}
