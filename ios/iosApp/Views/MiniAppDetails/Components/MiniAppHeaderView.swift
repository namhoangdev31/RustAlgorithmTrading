import SwiftUI
// import Shared — replaced by native Swift Shared module

struct MiniAppHeaderView: View {
    @EnvironmentObject var navigation: NavigationViewModel
    // UI-only: No data model dependency
    let isDownloaded: Bool
    let isLoading: Bool
    let onOpen: () -> Void
    let onDownload: () -> Void
    let onUninstall: () -> Void
    let onSettings: () -> Void
    
    var body: some View {
        HStack(alignment: .top, spacing: 16) {
            // App Icon
            RoundedRectangle(cornerRadius: 22)
                .fill(Color.blue.opacity(0.1))
                .frame(width: 118, height: 118)
                .overlay(
                    Image(systemName: "cube.box.fill") // Mock Icon
                        .font(.system(size: 50))
                        .foregroundColor(.blue)
                )
                .clipShape(RoundedRectangle(cornerRadius: 22))
                .shadow(color: .black.opacity(0.1), radius: 10, x: 0, y: 5)
            
            VStack(alignment: .leading, spacing: 4) {
                HStack{
                    Text("EcoTrack Pro") // Mock Name
                        .font(.system(size: 22, weight: .bold))
                        .fixedSize(horizontal: false, vertical: true)
                    Image(systemName: "checkmark.seal.fill") // Mock Icon
                        .font(.system(size: 22))
                        .foregroundColor(.green)
                }
                
                Button(action: {
                    navigation.navigate(to: .developer(id: "mock_dev"))
                }) {
                    Text("EcoSolutions Inc.")
                        .font(.subheadline)
                        .foregroundColor(.blue)
                }
                .buttonStyle(PlainButtonStyle())
                
                Text("Carbon Footprint Tracker") // Mock Description
                    .font(.system(size: 15))
                    .foregroundColor(.secondary)
                    .lineLimit(1)
                
                Spacer()
                
                HStack {
                    if isDownloaded {
                        Button(action: onOpen) {
                            Text("OPEN")
                                .font(.system(size: 15, weight: .bold))
                                .foregroundColor(.white)
                                .padding(.horizontal, 20)
                                .padding(.vertical, 7)
                                .background(Color.blue)
                                .cornerRadius(50)
                        }
                        
                        // Uninstall Button (Action Menu Style)
                        Menu {
                            Button(role: .cancel, action: onSettings) {
                                Label("Settings" , systemImage: "gear")
                            }
                            Button(role: .destructive, action: onUninstall) {
                                Label("Remove App", systemImage: "trash")
                            }
                        } label: {
                            Image(systemName: "ellipsis.circle.fill")
                                .font(.system(size: 32))
                                .foregroundColor(.blue.opacity(0.1))
                                .overlay(
                                    Image(systemName: "ellipsis")
                                        .font(.system(size: 14, weight: .bold))
                                        .foregroundColor(.blue)
                                )
                        }

                    } else {
                        Button(action: onDownload) {
                            if isLoading {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                    .frame(width: 74, height: 30)
                                    .background(Color.blue)
                                    .cornerRadius(15)
                            } else {
                                HStack{
                                    Image(systemName: "icloud.and.arrow.down") // Mock Icon
                                        .font(.system(size: 13))
                                        .foregroundColor(.white)
                                    Text("GET")
                                        .font(.system(size: 13, weight: .bold))
                                        .foregroundColor(.white)
                                        
                                }.padding(.horizontal, 20)
                                 .padding(.vertical, 7)
                                .background(Color.blue)
                                .cornerRadius(50)
                            }
                        }
                    }
                    
                    Spacer()
                    
                    Button(action: {}) {
                        Image(systemName: "square.and.arrow.up")
                            .font(.system(size: 20))
                            .foregroundColor(.blue)
                    }
                }
                
                Text("IN-APP PURCHASES")
                    .font(.system(size: 10, weight: .medium))
                    .foregroundColor(.gray)
                    .padding(.top, 4)
            }
        }
        .padding()
    }
}
