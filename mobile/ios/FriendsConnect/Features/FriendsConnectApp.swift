import SwiftUI

public enum UserRoleIOS: String, CaseIterable, Identifiable {
    case normal = "Normal User"
    case celebrity = "Celebrity"
    case organization = "Organization"
    case support = "Customer Care"
    case superAdmin = "Super Admin"

    public var id: String { rawValue }
}

public struct ActiveCallSessionIOS: Identifiable {
    public let id = UUID()
    public let callType: String
    public let peerName: String
    public var videoEnabled: Bool
    public let videoPermitted: Bool
    public let rateCoinsPerMin: Int
}

public struct FriendsConnectRootView: View {
    @State private var selectedRole: UserRoleIOS = .normal
    @State private var walletCoins: Int = 650
    @State private var activeCall: ActiveCallSessionIOS?
    @State private var bannerMessage: String?

    // Super Admin Granular Permissions
    @State private var canRandomAudio: Bool = true
    @State private var canRandomVideo: Bool = true
    @State private var canCallCelebrities: Bool = true

    public init() {}

    public var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                // Role Picker
                Picker("Role", selection: $selectedRole) {
                    ForEach(UserRoleIOS.allCases) { role in
                        Text(role.rawValue).tag(role)
                    }
                }
                .pickerStyle(.segmented)
                .padding(.horizontal)

                if let banner = bannerMessage {
                    Text(banner)
                        .font(.caption)
                        .padding(10)
                        .frame(maxWidth: .infinity)
                        .background(Color.blue.opacity(0.2))
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                        .padding(.horizontal)
                }

                ScrollView {
                    VStack(spacing: 16) {
                        switch selectedRole {
                        case .normal:
                            normalUserWorkspace
                        case .celebrity:
                            celebrityWorkspace
                        case .organization:
                            organizationWorkspace
                        case .support:
                            supportWorkspace
                        case .superAdmin:
                            superAdminWorkspace
                        }
                    }
                    .padding()
                }
            }
            .navigationTitle("Friends Connect")
            .toolbar {
                ToolbarItem(placement: .automatic) {
                    Text("🪙 \(walletCoins) Coins")
                        .font(.caption.bold())
                        .padding(.horizontal, 10)
                        .padding(.vertical, 5)
                        .background(Color.orange.opacity(0.2))
                        .clipShape(Capsule())
                }
            }
            .sheet(item: $activeCall) { call in
                VStack(spacing: 20) {
                    Text(call.videoEnabled && call.videoPermitted ? "📹 Live Video Call" : "🎙️ Live Audio Call")
                        .font(.title3.bold())

                    Text(call.peerName)
                        .font(.headline)

                    Text(call.videoPermitted
                         ? "Encrypted WebRTC Audio + Video Channel"
                         : "Strict Audio-Only Support Channel (Video Disabled)")
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    if call.rateCoinsPerMin > 0 {
                        Text("Metered Rate: \(call.rateCoinsPerMin) Coins / min")
                            .font(.caption.bold())
                            .foregroundStyle(.orange)
                    }

                    Button(role: .destructive) {
                        activeCall = nil
                    } label: {
                        Text("End Call")
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.red)
                            .foregroundStyle(.white)
                            .clipShape(RoundedRectangle(cornerRadius: 14))
                    }
                }
                .padding(24)
                .presentationDetents([.medium])
            }
        }
    }

    // MARK: - 1. Normal User Workspace
    private var normalUserWorkspace: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Random Friend Audio & Video Matchmaking
            VStack(alignment: .leading, spacing: 10) {
                Text("1-Tap Random Friend Matchmaking")
                    .font(.headline)
                Text("Connect with online friends via live Audio Call or Video Call.")
                    .font(.caption)
                    .foregroundStyle(.secondary)

                HStack(spacing: 12) {
                    Button {
                        guard canRandomAudio else {
                            bannerMessage = "Random Audio Calls restricted by Super Admin"
                            return
                        }
                        activeCall = ActiveCallSessionIOS(
                            callType: "RANDOM_AUDIO",
                            peerName: "Matched Online Friend",
                            videoEnabled: false,
                            videoPermitted: true,
                            rateCoinsPerMin: 0
                        )
                    } label: {
                        Label("Random Audio", systemImage: "mic.fill")
                            .font(.subheadline.bold())
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                            .background(Color.blue)
                            .foregroundStyle(.white)
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                    }

                    Button {
                        guard canRandomVideo else {
                            bannerMessage = "Random Video Calls restricted by Super Admin"
                            return
                        }
                        activeCall = ActiveCallSessionIOS(
                            callType: "RANDOM_VIDEO",
                            peerName: "Matched Online Friend",
                            videoEnabled: true,
                            videoPermitted: true,
                            rateCoinsPerMin: 0
                        )
                    } label: {
                        Label("Random Video", systemImage: "video.fill")
                            .font(.subheadline.bold())
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                            .background(Color.purple)
                            .foregroundStyle(.white)
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                    }
                }
            }
            .padding()
            .background(Color.secondary.opacity(0.12))
            .clipShape(RoundedRectangle(cornerRadius: 16))

            // Celebrity Audio & Video Calling
            VStack(alignment: .leading, spacing: 10) {
                Text("Verified Celebrity — Dulquer Sithara ✔")
                    .font(.headline)
                Text("Photos & Videos Feed • Audio Call (60c/m) • Video Call (150c/m)")
                    .font(.caption)
                    .foregroundStyle(.secondary)

                HStack(spacing: 12) {
                    Button {
                        guard canCallCelebrities && walletCoins >= 60 else {
                            bannerMessage = "Insufficient coins or restricted by Super Admin"
                            return
                        }
                        walletCoins -= 60
                        activeCall = ActiveCallSessionIOS(
                            callType: "CELEB_AUDIO",
                            peerName: "Dulquer Sithara (Audio)",
                            videoEnabled: false,
                            videoPermitted: false,
                            rateCoinsPerMin: 60
                        )
                    } label: {
                        Text("🎙️ Audio (60c/m)")
                            .font(.caption.bold())
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                            .background(Color.blue.opacity(0.85))
                            .foregroundStyle(.white)
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                    }

                    Button {
                        guard canCallCelebrities && walletCoins >= 150 else {
                            bannerMessage = "Insufficient coins or restricted by Super Admin"
                            return
                        }
                        walletCoins -= 150
                        activeCall = ActiveCallSessionIOS(
                            callType: "CELEB_VIDEO",
                            peerName: "Dulquer Sithara (Video)",
                            videoEnabled: true,
                            videoPermitted: true,
                            rateCoinsPerMin: 150
                        )
                    } label: {
                        Text("📹 Video (150c/m)")
                            .font(.caption.bold())
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                            .background(Color.pink)
                            .foregroundStyle(.white)
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                    }
                }
            }
            .padding()
            .background(Color.secondary.opacity(0.12))
            .clipShape(RoundedRectangle(cornerRadius: 16))

            // Location-based Events & Customer Care Audio Call
            VStack(alignment: .leading, spacing: 10) {
                Text("📍 Nearby Event: Kochi Sunset Music Fest (4.2 km)")
                    .font(.headline)
                HStack(spacing: 12) {
                    Button {
                        bannerMessage = "Booked VIP Event Ticket! QR Code saved."
                    } label: {
                        Text("🎟️ Book Ticket (₹499)")
                            .font(.caption.bold())
                            .padding(10)
                            .background(Color.green)
                            .foregroundStyle(.white)
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                    }

                    Button {
                        activeCall = ActiveCallSessionIOS(
                            callType: "SUPPORT_AUDIO",
                            peerName: "Customer Care Support Desk",
                            videoEnabled: false,
                            videoPermitted: false,
                            rateCoinsPerMin: 0
                        )
                    } label: {
                        Text("🎧 Support Audio Call")
                            .font(.caption.bold())
                            .padding(10)
                            .background(Color.gray.opacity(0.3))
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                    }
                }
            }
            .padding()
            .background(Color.secondary.opacity(0.12))
            .clipShape(RoundedRectangle(cornerRadius: 16))
        }
    }

    // MARK: - 2. Celebrity Workspace
    private var celebrityWorkspace: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Celebrity Studio — Upload Photos/Videos & Manage Call Rates")
                .font(.headline)
            Text("Earned Coins: 14,500 • Audio Rate: 60c/m • Video Rate: 150c/m")
                .font(.caption)
                .foregroundStyle(.secondary)
            Button("🎧 Call VIP Customer Care (Audio-Only)") {
                activeCall = ActiveCallSessionIOS(
                    callType: "SUPPORT_AUDIO",
                    peerName: "VIP Customer Care Desk",
                    videoEnabled: false,
                    videoPermitted: false,
                    rateCoinsPerMin: 0
                )
            }
            .buttonStyle(.borderedProminent)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color.secondary.opacity(0.12))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - 3. Organization Workspace
    private var organizationWorkspace: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Organization Event Publisher & QR Ticket Scanner")
                .font(.headline)
            Text("Post location-tagged events and scan attendee QR tickets.")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color.secondary.opacity(0.12))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - 4. Customer Care Support Workspace
    private var supportWorkspace: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Customer Care Support Queue (Audio-Only + Live Chat)")
                .font(.headline)
            Text("Assist Normal Users and Celebrities via Chat or Audio Call. Video is strictly disabled.")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color.secondary.opacity(0.12))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - 5. Super Admin Workspace
    private var superAdminWorkspace: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Super Admin — Granular Call & Account Moderation")
                .font(.headline)
            Toggle("Allow Random Audio Calls", isOn: $canRandomAudio)
            Toggle("Allow Random Video Calls", isOn: $canRandomVideo)
            Toggle("Allow Celebrity Audio/Video Calls", isOn: $canCallCelebrities)
        }
        .padding()
        .background(Color.secondary.opacity(0.12))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}
