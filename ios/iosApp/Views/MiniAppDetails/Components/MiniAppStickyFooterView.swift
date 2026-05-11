import SwiftUI
// import Shared — replaced by native Swift Shared module

@available(iOS 26.0, *)
struct MiniAppStickyFooterView: View {
    let isDownloaded: Bool
    let onOpen: () -> Void
    let onDownload: () -> Void
    
    var body: some View {
            HStack {
                // Icon
                Image(systemName: "cube.box.fill") // Mock Icon
                    .resizable()
                    .padding(8)
                    .background(Color.blue.opacity(0.1))
                    .frame(width: 40, height: 40)
                    .cornerRadius(8)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text("EcoTrack Pro") // Mock Name
                        .font(.subheadline)
                        .fontWeight(.semibold)
                    Text("Productivity") // Hardcoded category as requested
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                if isDownloaded {
                    Button(action: onOpen) {
                        Text("OPEN")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 20)
                            .padding(.vertical, 8)
                            .background(Color.blue)
                            .cornerRadius(20)
                    }
                } else {
                    Button(action: onDownload) {
                        Text("GET")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 20)
                            .padding(.vertical, 8)
                            .background(Color.blue)
                            .cornerRadius(20)
                    }
                }
            }
            .padding(16)
            .background(.clear)
            .glassEffect()
            .padding(.horizontal)
        }
    }

