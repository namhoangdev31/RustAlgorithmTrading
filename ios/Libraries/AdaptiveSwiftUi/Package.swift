// swift-tools-version: 6.2
import PackageDescription

let package = Package(
    name: "AdaptiveSwiftUi",
    platforms: [
        .iOS(.v15),
        .macOS(.v15),
        .tvOS(.v15),
        .watchOS(.v8),
        .visionOS(.v1),
    ],
    products: [
        .library(
            name: "AdaptiveSwiftUi",
            targets: ["AdaptiveSwiftUi"]
        )
    ],
    targets: [
        .target(
            name: "AdaptiveSwiftUi",
            path: "Sources"
        ),
        .testTarget(
            name: "AdaptiveSwiftUiTests",
            dependencies: ["AdaptiveSwiftUi"],
            path: "Tests/AdaptiveSwiftUiTests",
            resources: [
                .process("Fixtures")
            ]
        ),
    ]
)
