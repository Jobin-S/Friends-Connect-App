package com.friendsconnect.app.telecom

import android.telecom.Connection
import android.telecom.ConnectionRequest
import android.telecom.ConnectionService
import android.telecom.DisconnectCause
import android.telecom.PhoneAccountHandle
import android.telecom.TelecomManager

/**
 * Native Android Telecom ConnectionService supporting:
 * - Random Friend Audio & Video Calls
 * - Celebrity Audio & Video Calls (Per-minute coin metered)
 * - Customer Care Support Calls (Strictly Audio-Only; Video disabled)
 */
class FriendsConnectCallService : ConnectionService() {

    override fun onCreateIncomingConnection(
        connectionManagerPhoneAccount: PhoneAccountHandle?,
        request: ConnectionRequest?
    ): Connection {
        val callType = request?.extras?.getString("CALL_TYPE") ?: "RANDOM_AUDIO"
        val isVideoAllowed = callType == "RANDOM_VIDEO" || callType == "CELEB_VIDEO"

        return FriendsConnectCallConnection(callType, isVideoAllowed).apply {
            setInitializing()
            setActive()
        }
    }

    override fun onCreateOutgoingConnection(
        connectionManagerPhoneAccount: PhoneAccountHandle?,
        request: ConnectionRequest?
    ): Connection {
        val callType = request?.extras?.getString("CALL_TYPE") ?: "RANDOM_AUDIO"
        // Enforce policy: SUPPORT_AUDIO never enables video capabilities
        val isVideoAllowed = (callType == "RANDOM_VIDEO" || callType == "CELEB_VIDEO") &&
            callType != "SUPPORT_AUDIO"

        return FriendsConnectCallConnection(callType, isVideoAllowed).apply {
            setDialing()
            setActive()
        }
    }
}

class FriendsConnectCallConnection(
    val callType: String,
    val videoAllowed: Boolean
) : Connection() {

    init {
        connectionProperties = PROPERTY_SELF_MANAGED
        connectionCapabilities = CAPABILITY_MUTE or CAPABILITY_SUPPORT_HOLD
        videoState = if (videoAllowed) {
            android.telecom.VideoProfile.STATE_BIDIRECTIONAL
        } else {
            android.telecom.VideoProfile.STATE_AUDIO_ONLY
        }
    }

    override fun onAnswer() {
        setActive()
    }

    override fun onReject() {
        setDisconnected(DisconnectCause(DisconnectCause.REJECTED))
        destroy()
    }

    override fun onDisconnect() {
        setDisconnected(DisconnectCause(DisconnectCause.LOCAL))
        destroy()
    }
}
