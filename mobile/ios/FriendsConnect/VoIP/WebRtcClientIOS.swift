import Foundation
import AVFoundation

#if canImport(WebRTC)
import WebRTC
#endif

/// Native iOS WebRTC Engine (`RTCPeerConnectionFactory` + `RTCAudioTrack` + `RTCVideoTrack` + `RTCCameraVideoCapturer`)
/// Enforces the platform call matrix:
/// - `RANDOM_VIDEO` & `CELEB_VIDEO`: Bidirectional Opus Audio + H.264/VP8 Video
/// - `RANDOM_AUDIO` & `CELEB_AUDIO`: Opus Audio Track
/// - `SUPPORT_AUDIO` (Customer Care): Strictly Audio-Only (`videoAllowed = false`; camera track is never created or negotiated)
public final class WebRtcClientIOS: NSObject {
    public static let shared = WebRtcClientIOS()

    public private(set) var currentRoomName: String = ""
    public private(set) var currentCallMode: String = "RANDOM_AUDIO"
    public private(set) var isAudioMuted: Bool = false
    public private(set) var isVideoEnabled: Bool = false

    public let iceServerUrls: [String] = [
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302"
    ]

    #if canImport(WebRTC)
    private var factory: RTCPeerConnectionFactory?
    private var peerConnection: RTCPeerConnection?
    private var localAudioTrack: RTCAudioTrack?
    private var localVideoTrack: RTCVideoTrack?
    private var videoCapturer: RTCCameraVideoCapturer?
    #endif

    private override init() {
        super.init()
        #if canImport(WebRTC)
        RTCInitializeSSL()
        let encoderFactory = RTCDefaultVideoEncoderFactory()
        let decoderFactory = RTCDefaultVideoDecoderFactory()
        self.factory = RTCPeerConnectionFactory(
            encoderFactory: encoderFactory,
            decoderFactory: decoderFactory
        )
        #endif
    }

    public func startWebRtcCall(
        roomName: String,
        userId: String,
        callMode: String
    ) -> (audioActive: Bool, videoActive: Bool) {
        self.currentRoomName = roomName
        self.currentCallMode = callMode
        self.isAudioMuted = false

        // Strict Policy: Video is NEVER allowed on SUPPORT_AUDIO (Customer Care Support)
        let videoAllowed = (callMode == "RANDOM_VIDEO" || callMode == "CELEB_VIDEO") &&
            callMode != "SUPPORT_AUDIO"
        self.isVideoEnabled = videoAllowed

        configureAudioSession(isVideo: videoAllowed)

        #if canImport(WebRTC)
        guard let factory = self.factory else {
            return (true, videoAllowed)
        }

        let config = RTCConfiguration()
        config.iceServers = [RTCIceServer(urlStrings: iceServerUrls)]
        config.sdpSemantics = .unifiedPlan
        config.continualGatheringPolicy = .gatherContinually

        let constraints = RTCMediaConstraints(
            mandatoryConstraints: nil,
            optionalConstraints: ["DtlsSrtpKeyAgreement": kRTCMediaConstraintsValueTrue]
        )

        self.peerConnection = factory.peerConnection(
            with: config,
            constraints: constraints,
            delegate: nil
        )

        // 1. Attach WebRTC Audio Track
        let audioSource = factory.audioSource(with: RTCMediaConstraints(mandatoryConstraints: nil, optionalConstraints: nil))
        let audioTrack = factory.audioTrack(with: audioSource, trackId: "ARDAMSa0")
        audioTrack.isEnabled = true
        self.localAudioTrack = audioTrack
        self.peerConnection?.add(audioTrack, streamIds: ["ARDAMS"])

        // 2. Attach WebRTC Video Track ONLY when videoAllowed == true
        if videoAllowed {
            let videoSource = factory.videoSource()
            self.videoCapturer = RTCCameraVideoCapturer(delegate: videoSource)
            let videoTrack = factory.videoTrack(with: videoSource, trackId: "ARDAMSv0")
            videoTrack.isEnabled = true
            self.localVideoTrack = videoTrack
            self.peerConnection?.add(videoTrack, streamIds: ["ARDAMS"])
        }
        #endif

        return (true, videoAllowed)
    }

    public func setAudioMuted(_ muted: Bool) {
        self.isAudioMuted = muted
        #if canImport(WebRTC)
        self.localAudioTrack?.isEnabled = !muted
        #endif
    }

    public func setVideoEnabled(_ enabled: Bool) -> Bool {
        if currentCallMode == "SUPPORT_AUDIO" {
            self.isVideoEnabled = false
            return false
        }
        self.isVideoEnabled = enabled
        #if canImport(WebRTC)
        self.localVideoTrack?.isEnabled = enabled
        #endif
        return enabled
    }

    public func stopWebRtcCall() {
        #if canImport(WebRTC)
        self.localAudioTrack?.isEnabled = false
        self.localVideoTrack?.isEnabled = false
        self.peerConnection?.close()
        self.peerConnection = nil
        #endif
        self.isVideoEnabled = false
    }

    private func configureAudioSession(isVideo: Bool) {
        #if os(iOS)
        let session = AVAudioSession.sharedInstance()
        try? session.setCategory(
            .playAndRecord,
            mode: isVideo ? .videoChat : .voiceChat,
            options: [.allowBluetooth, .defaultToSpeaker]
        )
        try? session.setActive(true)
        #endif
    }
}
