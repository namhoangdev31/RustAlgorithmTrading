import SwiftUI

struct SystemView: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("System")
                    .font(.headline)
                Spacer()
                UniButton("See All") { }
                    .font(.caption)
                    .uniForegroundStyle(.blue)
            }
            .padding(.horizontal)
            
            HStack(spacing: 16) {
                UniButton(action: {}) {
                    HStack {
                        Image(systemName: "gearshape.fill")
                        Text("Settings")
                            .fontWeight(.bold)
                    }
                    .uniForegroundStyle(.black)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.leposSurface)
                    .clipShape(RoundedRectangle(cornerRadius: 20))
                    .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
                }
                
                UniButton(action: {}) {
                    HStack {
                        Image(systemName: "plus.circle.fill")
                            .uniForegroundStyle(.gray)
                        Text("Add New")
                            .fontWeight(.bold)
                            .uniForegroundStyle(.gray)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.leposSurface)
                    .clipShape(RoundedRectangle(cornerRadius: 20))
                    .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
                }
            }
            .padding(.horizontal)
        }
    }
}
