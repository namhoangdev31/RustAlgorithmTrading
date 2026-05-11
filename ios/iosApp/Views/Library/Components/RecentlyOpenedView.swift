import SwiftUI

struct RecentlyOpenedView: View {
    let items = [
        ("Dining", "fork.knife", Color.orange),
        ("Travel", "airplane", Color.blue),
        ("Retail", "bag.fill", Color.green),
        ("Media", "film.fill", Color.purple)
    ]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Recently Opened")
                    .font(.headline)
                Spacer()
                Button("See All") { }
                    .font(.caption)
                    .foregroundColor(.blue)
            }
            .padding(.horizontal)
            
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 20) {
                    ForEach(items, id: \.0) { item in
                        VStack(spacing: 8) {
                            Circle()
                                .fill(item.2.opacity(0.1))
                                .frame(width: 70, height: 70)
                                .overlay(
                                    Image(systemName: item.1)
                                        .font(.title)
                                        .foregroundColor(item.2)
                                )
                            
                            Text(item.0)
                                .font(.caption)
                                .foregroundColor(.gray)
                        }
                    }
                }
                .padding(.horizontal)
            }
        }
    }
}
