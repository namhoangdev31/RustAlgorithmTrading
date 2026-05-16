import SwiftUI
import AdaptiveSwiftUi

// import Shared — replaced by native Swift Shared module

struct WishlistItem: Identifiable {
    let id = UUID()
    let name: String
    let category: String
    let iconName: String
    let iconColor: Color
    let rating: Double
}

struct WishlistView: View {
    @EnvironmentObject var navigation: NavigationViewModel
    
    // Mock Data
    @State private var wishlistItems: [WishlistItem] = [
        WishlistItem(name: "Zen Space", category: "Health", iconName: "heart.fill", iconColor: .pink, rating: 4.9),
        WishlistItem(name: "Pixel Art", category: "Design", iconName: "paintbrush.fill", iconColor: .purple, rating: 4.7),
        WishlistItem(name: "Travel Mate", category: "Travel", iconName: "airplane", iconColor: .cyan, rating: 4.4),
        WishlistItem(name: "CryptoWatch", category: "Finance", iconName: "bitcoinsign.circle.fill", iconColor: .orange, rating: 4.3)
    ]
    
    let columns = [
        GridItem(.flexible()),
        GridItem(.flexible())
    ]
    
    var body: some View {
        NavigationView { // Keep NavigationView for title if needed, or remove if parent handles it.
            // MainTabView items often have their own NavigationStack or View.
            // The placeholder had NavigationView.
            AdaptiveScrollView {
                if wishlistItems.isEmpty {
                    AdaptiveContentUnavailableView(
                        "No Saved Apps",
                        systemImage: "heart.slash",
                        description: "Apps you add to your wishlist will appear here."
                    ) {
                        AdaptiveButton(action: {
                            // Navigate to discovery?
                        }) {
                            Text("Explore Apps")
                                .font(.headline)
                                .foregroundColor(.white)
                                .padding()
                                .frame(maxWidth: .infinity)
                                .background(Color.blue)
                                .cornerRadius(12)
                        }
                        .padding(.top, 16)
                        .padding(.horizontal, 48)
                    }
                } else {
                    LazyVGrid(columns: columns, spacing: 16) {
                        ForEach(wishlistItems) { item in
                            VStack(alignment: .leading, spacing: 12) {
                                HStack(alignment: .top) {
                                    RoundedRectangle(cornerRadius: 12)
                                        .fill(item.iconColor)
                                        .frame(width: 48, height: 48)
                                        .overlay(
                                            Image(systemName: item.iconName)
                                                .foregroundColor(.white)
                                                .font(.title3)
                                        )
                                    
                                    Spacer()
                                    
                                    AdaptiveButton(action: {
                                        if let index = wishlistItems.firstIndex(where: { $0.id == item.id }) {
                                            wishlistItems.remove(at: index)
                                        }
                                    }) {
                                        Image(systemName: "heart.fill")
                                            .foregroundColor(.red)
                                            .padding(8)
                                            .background(Color.red.opacity(0.1))
                                            .clipShape(Circle())
                                    }
                                }
                                
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(item.name)
                                        .font(.headline)
                                        .lineLimit(1)
                                    Text(item.category)
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                    
                                    HStack(spacing: 4) {
                                        Image(systemName: "star.fill")
                                            .font(.caption2)
                                            .foregroundColor(.orange)
                                        Text(String(format: "%.1f", item.rating))
                                            .font(.caption2)
                                            .foregroundColor(.gray)
                                    }
                                }
                                
                                AdaptiveButton(action: {
                                    // Navigate to details
                                    navigation.navigate(to: .detail(itemId: item.id.uuidString))
                                }) {
                                    Text("GET")
                                        .font(.caption)
                                        .fontWeight(.bold)
                                        .foregroundColor(.blue)
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 6)
                                        .background(Color.blue.opacity(0.1))
                                        .clipShape(Capsule())
                                }
                            }
                            .padding()
                            .background(Color(.systemBackground))
                            .cornerRadius(16)
                            .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
                        }
                    }
                    .padding()
                }
            }
            .navigationTitle("Wishlist")
        }
    }
}
