import SwiftUI

struct StorageOverviewView: View {
    // Mock Data
    let totalStorage: Double = 64.0 // GB
    let usedStorage: Double = 42.5 // GB
    
    var percentage: Double {
        usedStorage / totalStorage
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Storage")
                    .font(.headline)
                Spacer()
                Text("\(String(format: "%.1f", usedStorage)) GB of \(String(format: "%.0f", totalStorage)) GB used")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            
            // Progress Bar
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 6)
                        .fill(Color(.secondarySystemBackground))
                        .frame(height: 12)
                    
                    HStack(spacing: 0) {
                        RoundedRectangle(cornerRadius: 6)
                            .fill(Color.blue)
                            .frame(width: geometry.size.width * 0.45, height: 12)
                        RoundedRectangle(cornerRadius: 6)
                            .fill(Color.green)
                            .frame(width: geometry.size.width * 0.15, height: 12)
                        RoundedRectangle(cornerRadius: 6)
                            .fill(Color.orange)
                            .frame(width: geometry.size.width * 0.10, height: 12)
                    }
                    .clipShape(RoundedRectangle(cornerRadius: 6))
                }
            }
            .frame(height: 12)
            
            // Legend
            HStack(spacing: 16) {
                LegendItem(color: .blue, label: "Apps")
                LegendItem(color: .green, label: "Media")
                LegendItem(color: .orange, label: "Cache")
                Spacer()
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .padding(.horizontal)
    }
}

struct LegendItem: View {
    let color: Color
    let label: String
    
    var body: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(color)
                .frame(width: 8, height: 8)
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}
