// swift-tools-version: 5.10
import PackageDescription

let package = Package(
    name: "FriendsConnectIOS",
    platforms: [
        .iOS(.v17),
        .macOS(.v14)
    ],
    products: [
        .library(
            name: "FriendsConnectIOS",
            targets: ["FriendsConnectIOS"]
        )
    ],
    targets: [
        .target(
            name: "FriendsConnectIOS",
            path: "FriendsConnect"
        )
    ]
)
