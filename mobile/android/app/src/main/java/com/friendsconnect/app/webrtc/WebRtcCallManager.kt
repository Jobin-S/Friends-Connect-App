package com.friendsconnect.app.webrtc

import android.content.Context
import io.socket.client.IO
import io.socket.client.Socket
import org.json.JSONObject
import org.webrtc.*

/**
 * Native Android WebRTC Engine (`org.webrtc.PeerConnectionFactory`)
 * Supports:
 * 1. Normal User <-> Normal User: Random Audio Call & Random Video Call
 * 2. Normal User -> Celebrity: Metered Audio Call & Video Call
 * 3. User/Celebrity <-> Customer Care (`SUPPORT_AUDIO`): Strictly Audio-Only (VideoCapturer & VideoTrack never created)
 */
class WebRtcCallManager(
    private val context: Context,
    private val signalingUrl: String = "http://10.0.2.2:4000"
) {
    private val eglBase: EglBase = EglBase.create()
    private var peerConnectionFactory: PeerConnectionFactory? = null
    private var peerConnection: PeerConnection? = null
    private var localAudioTrack: AudioTrack? = null
    private var localVideoTrack: VideoTrack? = null
    private var videoCapturer: VideoCapturer? = null
    private var socket: Socket? = null

    private var currentRoomName: String = ""
    private var currentUserId: String = ""
    private var currentCallMode: String = "RANDOM_AUDIO"

    private val iceServers = listOf(
        PeerConnection.IceServer.builder("stun:stun.l.google.com:19302").createIceServer(),
        PeerConnection.IceServer.builder("stun:stun1.l.google.com:19302").createIceServer()
    )

    init {
        PeerConnectionFactory.initialize(
            PeerConnectionFactory.InitializationOptions.builder(context)
                .setEnableInternalTracer(true)
                .createInitializationOptions()
        )

        peerConnectionFactory = PeerConnectionFactory.builder()
            .setVideoEncoderFactory(DefaultVideoEncoderFactory(eglBase.eglBaseContext, true, true))
            .setVideoDecoderFactory(DefaultVideoDecoderFactory(eglBase.eglBaseContext))
            .createPeerConnectionFactory()
    }

    fun startWebRtcSession(
        roomName: String,
        userId: String,
        displayName: String,
        callMode: String,
        localRenderer: SurfaceViewRenderer? = null,
        remoteRenderer: SurfaceViewRenderer? = null
    ) {
        currentRoomName = roomName
        currentUserId = userId
        currentCallMode = callMode

        // Strict Policy: Video is ONLY allowed for RANDOM_VIDEO and CELEB_VIDEO (never SUPPORT_AUDIO)
        val isVideoAllowed =
            (callMode == "RANDOM_VIDEO" || callMode == "CELEB_VIDEO") &&
                callMode != "SUPPORT_AUDIO"

        val factory = peerConnectionFactory ?: return

        // 1. Create WebRTC Audio Track (with hardware Echo Cancellation & Noise Suppression)
        val audioConstraints = MediaConstraints().apply {
            mandatory.add(MediaConstraints.KeyValuePair("googEchoCancellation", "true"))
            mandatory.add(MediaConstraints.KeyValuePair("googNoiseSuppression", "true"))
            mandatory.add(MediaConstraints.KeyValuePair("googAutoGainControl", "true"))
        }
        val audioSource = factory.createAudioSource(audioConstraints)
        localAudioTrack = factory.createAudioTrack("ARDAMSa0", audioSource).apply {
            setEnabled(true)
        }

        // 2. Create WebRTC Video Track ONLY if video is permitted for this call mode
        if (isVideoAllowed) {
            videoCapturer = createCameraCapturer()
            videoCapturer?.let { capturer ->
                val surfaceTextureHelper =
                    SurfaceTextureHelper.create("CaptureThread", eglBase.eglBaseContext)
                val videoSource = factory.createVideoSource(capturer.isScreencast)
                capturer.initialize(surfaceTextureHelper, context, videoSource.capturerObserver)
                capturer.startCapture(1280, 720, 30)

                localVideoTrack = factory.createVideoTrack("ARDAMSv0", videoSource).apply {
                    setEnabled(true)
                    localRenderer?.let { addSink(it) }
                }
            }
        }

        // 3. Create RTCPeerConnection
        val rtcConfig = PeerConnection.RTCConfiguration(iceServers).apply {
            sdpSemantics = PeerConnection.SdpSemantics.UNIFIED_PLAN
        }

        peerConnection = factory.createPeerConnection(
            rtcConfig,
            object : PeerConnection.Observer {
                override fun onIceCandidate(candidate: IceCandidate?) {
                    candidate ?: return
                    val json = JSONObject().apply {
                        put("roomName", currentRoomName)
                        put("senderId", currentUserId)
                        put(
                            "candidate",
                            JSONObject().apply {
                                put("candidate", candidate.sdp)
                                put("sdpMid", candidate.sdpMid)
                                put("sdpMLineIndex", candidate.sdpMLineIndex)
                            }
                        )
                    }
                    socket?.emit("webrtc_ice_candidate", json)
                }

                override fun onTrack(transceiver: RtpTransceiver?) {
                    val track = transceiver?.receiver?.track() ?: return
                    if (track is VideoTrack && isVideoAllowed) {
                        remoteRenderer?.let { track.addSink(it) }
                    }
                }

                override fun onSignalingChange(state: PeerConnection.SignalingState?) {}
                override fun onIceConnectionChange(state: PeerConnection.IceConnectionState?) {}
                override fun onIceConnectionReceivingChange(receiving: Boolean) {}
                override fun onIceGatheringChange(state: PeerConnection.IceGatheringState?) {}
                override fun onIceCandidatesRemoved(candidates: Array<out IceCandidate>?) {}
                override fun onAddStream(stream: MediaStream?) {}
                override fun onRemoveStream(stream: MediaStream?) {}
                override fun onDataChannel(channel: DataChannel?) {}
                override fun onRenegotiationNeeded() {}
            }
        )

        localAudioTrack?.let { peerConnection?.addTrack(it, listOf("ARDAMS")) }
        if (isVideoAllowed) {
            localVideoTrack?.let { peerConnection?.addTrack(it, listOf("ARDAMS")) }
        }

        // 4. Connect Socket.io Signaling for SDP Offer/Answer & ICE Exchange
        connectSignaling(displayName, isVideoAllowed)
    }

    private fun connectSignaling(displayName: String, isVideoAllowed: Boolean) {
        socket = IO.socket(signalingUrl).apply {
            on(Socket.EVENT_CONNECT) {
                val joinPayload = JSONObject().apply {
                    put("roomName", currentRoomName)
                    put("userId", currentUserId)
                    put("displayName", displayName)
                    put("callMode", currentCallMode)
                }
                emit("webrtc_join_room", joinPayload)
            }

            on("webrtc_peer_joined") {
                val constraints = MediaConstraints().apply {
                    mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveAudio", "true"))
                    mandatory.add(
                        MediaConstraints.KeyValuePair(
                            "OfferToReceiveVideo",
                            if (isVideoAllowed) "true" else "false"
                        )
                    )
                }
                peerConnection?.createOffer(object : SdpObserverAdapter() {
                    override fun onCreateSuccess(desc: SessionDescription?) {
                        desc ?: return
                        peerConnection?.setLocalDescription(SdpObserverAdapter(), desc)
                        val offerJson = JSONObject().apply {
                            put("roomName", currentRoomName)
                            put("senderId", currentUserId)
                            put("callMode", currentCallMode)
                            put(
                                "sdp",
                                JSONObject().apply {
                                    put("type", "offer")
                                    put("sdp", desc.description)
                                }
                            )
                        }
                        emit("webrtc_sdp_offer", offerJson)
                    }
                }, constraints)
            }

            on("webrtc_sdp_offer") { args ->
                val data = args.firstOrNull() as? JSONObject ?: return@on
                val sdpObj = data.optJSONObject("sdp") ?: return@on
                val remoteOffer = SessionDescription(
                    SessionDescription.Type.OFFER,
                    sdpObj.optString("sdp")
                )
                peerConnection?.setRemoteDescription(SdpObserverAdapter(), remoteOffer)

                peerConnection?.createAnswer(object : SdpObserverAdapter() {
                    override fun onCreateSuccess(answer: SessionDescription?) {
                        answer ?: return
                        peerConnection?.setLocalDescription(SdpObserverAdapter(), answer)
                        val answerJson = JSONObject().apply {
                            put("roomName", currentRoomName)
                            put("senderId", currentUserId)
                            put("callMode", currentCallMode)
                            put(
                                "sdp",
                                JSONObject().apply {
                                    put("type", "answer")
                                    put("sdp", answer.description)
                                }
                            )
                        }
                        emit("webrtc_sdp_answer", answerJson)
                    }
                }, MediaConstraints())
            }

            on("webrtc_sdp_answer") { args ->
                val data = args.firstOrNull() as? JSONObject ?: return@on
                val sdpObj = data.optJSONObject("sdp") ?: return@on
                val remoteAnswer = SessionDescription(
                    SessionDescription.Type.ANSWER,
                    sdpObj.optString("sdp")
                )
                peerConnection?.setRemoteDescription(SdpObserverAdapter(), remoteAnswer)
            }

            on("webrtc_ice_candidate") { args ->
                val data = args.firstOrNull() as? JSONObject ?: return@on
                val candObj = data.optJSONObject("candidate") ?: return@on
                val candidate = IceCandidate(
                    candObj.optString("sdpMid"),
                    candObj.optInt("sdpMLineIndex"),
                    candObj.optString("candidate")
                )
                peerConnection?.addIceCandidate(candidate)
            }

            connect()
        }
    }

    fun toggleAudioMute(muted: Boolean) {
        localAudioTrack?.setEnabled(!muted)
    }

    fun toggleVideoEnabled(enabled: Boolean): Boolean {
        if (currentCallMode == "SUPPORT_AUDIO") return false
        localVideoTrack?.setEnabled(enabled)
        return enabled
    }

    fun disconnectSession() {
        socket?.disconnect()
        socket = null
        try {
            videoCapturer?.stopCapture()
        } catch (_: Exception) {}
        videoCapturer?.dispose()
        localAudioTrack?.dispose()
        localVideoTrack?.dispose()
        peerConnection?.close()
        peerConnection = null
    }

    private fun createCameraCapturer(): VideoCapturer? {
        val enumerator = Camera2Enumerator(context)
        val deviceNames = enumerator.deviceNames
        // Prefer front camera for 1:1 social & celebrity video calls
        for (deviceName in deviceNames) {
            if (enumerator.isFrontFacing(deviceName)) {
                return enumerator.createCapturer(deviceName, null)
            }
        }
        for (deviceName in deviceNames) {
            if (!enumerator.isFrontFacing(deviceName)) {
                return enumerator.createCapturer(deviceName, null)
            }
        }
        return null
    }
}

open class SdpObserverAdapter : SdpObserver {
    override fun onCreateSuccess(desc: SessionDescription?) {}
    override fun onSetSuccess() {}
    override fun onCreateFailure(error: String?) {}
    override fun onSetFailure(error: String?) {}
}
