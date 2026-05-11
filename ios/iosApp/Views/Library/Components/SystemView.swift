import SwiftUI

struct SystemView: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("System")
                    .font(.headline)
                Spacer()
                Button("See All") { }
                    .font(.caption)
                    .foregroundColor(.blue)
            }
            .padding(.horizontal)
            
            HStack(spacing: 16) {
                Button(action: {}) {
                    HStack {
                        Image(systemName: "gearshape.fill")
                        Text("Settings")
                            .fontWeight(.bold)
                    }
                    .foregroundColor(.black)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 20))
                    .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
                }
                
                Button(action: {}) {
                    HStack {
                        Image(systemName: "plus.circle.fill")
                            .foregroundColor(.gray)
                        Text("Add New")
                            .fontWeight(.bold)
                            .foregroundColor(.gray)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 20))
                    .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
                }
            }
            .padding(.horizontal)
        }
    }
}
