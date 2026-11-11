package com.friendsconnect.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

enum class AppRole(val title: String) {
    NORMAL("Normal User"),
    CELEBRITY("Celebrity"),
    ORG("Organization"),
    SUPPORT("Customer Care"),
    SUPER_ADMIN("Super Admin")
}

data class ActiveCallUiState(
    val callType: String,
    val peerName: String,
    val videoEnabled: Boolean,
    val videoPermitted: Boolean,
    val coinsPerMin: Int
)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme(colorScheme = darkColorScheme()) {
                FriendsConnectNativeScreen()
            }
        }
    }
}

@Composable
fun FriendsConnectNativeScreen() {
    var selectedRole by remember { mutableStateOf(AppRole.NORMAL) }
    var walletCoins by remember { mutableIntStateOf(650) }
    var activeCall by remember { mutableStateOf<ActiveCallUiState?>(null) }
    var statusBanner by remember { mutableStateOf<String?>(null) }

    // Super Admin Restriction States
    var allowRandomAudio by remember { mutableStateOf(true) }
    var allowRandomVideo by remember { mutableStateOf(true) }
    var allowCelebrityCalls by remember { mutableStateOf(true) }

    Scaffold(
        containerColor = Color(0xFF090D16),
        topBar = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF0D1322))
                    .padding(16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Friends Connect (Android Native)",
                            color = Color.White,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Random Audio/Video • Celebrities • Geo-Events • Support",
                            color = Color(0xFF94A3B8),
                            fontSize = 12.sp
                        )
                    }
                    Surface(
                        color = Color(0x33F59E0B),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(
                            text = "🪙 $walletCoins Coins",
                            color = Color(0xFFFCD34D),
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Role Switcher Row
                ScrollableTabRow(
                    selectedTabIndex = selectedRole.ordinal,
                    containerColor = Color(0xFF111827),
                    contentColor = Color.White,
                    edgePadding = 0.dp
                ) {
                    AppRole.entries.forEach { role ->
                        Tab(
                            selected = selectedRole == role,
                            onClick = { selectedRole = role },
                            text = {
                                Text(
                                    text = role.title,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(16.dp)
        ) {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                statusBanner?.let { msg ->
                    item {
                        Surface(
                            color = Color(0xFF1E3A8A),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = msg,
                                color = Color.White,
                                fontSize = 13.sp,
                                modifier = Modifier.padding(12.dp)
                            )
                        }
                    }
                }

                when (selectedRole) {
                    AppRole.NORMAL -> {
                        // 1. Random Friend Audio & Video Call Card
                        item {
                            Card(
                                colors = CardDefaults.cardColors(containerColor = Color(0xFF111827)),
                                shape = RoundedCornerShape(16.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Text(
                                        text = "Connect with Random Online Friends",
                                        color = Color.White,
                                        fontSize = 17.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = "Tap to join matchmaking for 1:1 Live Audio Call or Video Call",
                                        color = Color(0xFF94A3B8),
                                        fontSize = 12.sp,
                                        modifier = Modifier.padding(top = 4.dp, bottom = 12.dp)
                                    )
                                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        Button(
                                            onClick = {
                                                if (!allowRandomAudio) {
                                                    statusBanner = "Random Audio Call restricted by Super Admin"
                                                } else {
                                                    activeCall = ActiveCallUiState(
                                                        callType = "RANDOM_AUDIO",
                                                        peerName = "Online Friend (Audio Match)",
                                                        videoEnabled = false,
                                                        videoPermitted = true,
                                                        coinsPerMin = 0
                                                    )
                                                }
                                            },
                                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2563EB))
                                        ) {
                                            Text("🎙️ Random Audio")
                                        }
                                        Button(
                                            onClick = {
                                                if (!allowRandomVideo) {
                                                    statusBanner = "Random Video Call restricted by Super Admin"
                                                } else {
                                                    activeCall = ActiveCallUiState(
                                                        callType = "RANDOM_VIDEO",
                                                        peerName = "Online Friend (Video Match)",
                                                        videoEnabled = true,
                                                        videoPermitted = true,
                                                        coinsPerMin = 0
                                                    )
                                                }
                                            },
                                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF7C3AED))
                                        ) {
                                            Text("📹 Random Video")
                                        }
                                    }
                                }
                            }
                        }

                        // 2. Celebrity Feed & Per-Minute Audio/Video Calling
                        item {
                            Card(
                                colors = CardDefaults.cardColors(containerColor = Color(0xFF111827)),
                                shape = RoundedCornerShape(16.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Text(
                                        text = "Verified Celebrity — Dulquer Sithara ✔",
                                        color = Color.White,
                                        fontSize = 16.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = "Available for Premium Audio Call (60c/m) & Video Call (150c/m)",
                                        color = Color(0xFFFBBF24),
                                        fontSize = 12.sp,
                                        modifier = Modifier.padding(vertical = 6.dp)
                                    )
                                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        Button(
                                            onClick = {
                                                if (walletCoins >= 60 && allowCelebrityCalls) {
                                                    walletCoins -= 60
                                                    activeCall = ActiveCallUiState(
                                                        callType = "CELEB_AUDIO",
                                                        peerName = "Dulquer Sithara (Celebrity Audio)",
                                                        videoEnabled = false,
                                                        videoPermitted = false,
                                                        coinsPerMin = 60
                                                    )
                                                } else {
                                                    statusBanner = "Insufficient coins or restricted by Super Admin"
                                                }
                                            }
                                        ) {
                                            Text("🎙️ Audio (60c/m)")
                                        }
                                        Button(
                                            onClick = {
                                                if (walletCoins >= 150 && allowCelebrityCalls) {
                                                    walletCoins -= 150
                                                    activeCall = ActiveCallUiState(
                                                        callType = "CELEB_VIDEO",
                                                        peerName = "Dulquer Sithara (Celebrity Video)",
                                                        videoEnabled = true,
                                                        videoPermitted = true,
                                                        coinsPerMin = 150
                                                    )
                                                } else {
                                                    statusBanner = "Insufficient coins or restricted by Super Admin"
                                                }
                                            },
                                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFDB2777))
                                        ) {
                                            Text("📹 Video (150c/m)")
                                        }
                                    }
                                }
                            }
                        }

                        // 3. Location-Based Events & Support Audio Call
                        item {
                            Card(
                                colors = CardDefaults.cardColors(containerColor = Color(0xFF111827)),
                                shape = RoundedCornerShape(16.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Text(
                                        text = "📍 Kochi Sunset Music & Indie Fest (4.2 km away)",
                                        color = Color.White,
                                        fontSize = 16.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = "Bolgatty Palace Grounds • Tickets from ₹499",
                                        color = Color(0xFF94A3B8),
                                        fontSize = 12.sp,
                                        modifier = Modifier.padding(vertical = 6.dp)
                                    )
                                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        Button(
                                            onClick = {
                                                statusBanner = "Booked VIP Ticket! QR Pass saved to your wallet."
                                            },
                                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF059669))
                                        ) {
                                            Text("🎟️ Book Ticket (₹499)")
                                        }
                                        OutlinedButton(
                                            onClick = {
                                                activeCall = ActiveCallUiState(
                                                    callType = "SUPPORT_AUDIO",
                                                    peerName = "Customer Care Support (Audio-Only)",
                                                    videoEnabled = false,
                                                    videoPermitted = false,
                                                    coinsPerMin = 0
                                                )
                                            }
                                        ) {
                                            Text("🎧 Support Audio Call")
                                        }
                                    }
                                }
                            }
                        }
                    }

                    AppRole.CELEBRITY -> {
                        item {
                            Card(
                                colors = CardDefaults.cardColors(containerColor = Color(0xFF111827)),
                                shape = RoundedCornerShape(16.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Text(
                                        text = "Celebrity Studio — Media & Call Rates",
                                        color = Color.White,
                                        fontSize = 17.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = "Earned Coins: 14,500 • Upload Photos/Videos • Receive Fan Audio & Video Calls",
                                        color = Color(0xFF34D399),
                                        fontSize = 12.sp,
                                        modifier = Modifier.padding(vertical = 6.dp)
                                    )
                                    Button(
                                        onClick = {
                                            activeCall = ActiveCallUiState(
                                                callType = "SUPPORT_AUDIO",
                                                peerName = "VIP Customer Care Desk (Audio-Only)",
                                                videoEnabled = false,
                                                videoPermitted = false,
                                                coinsPerMin = 0
                                            )
                                        }
                                    ) {
                                        Text("🎧 Call VIP Customer Care (Audio-Only)")
                                    }
                                }
                            }
                        }
                    }

                    AppRole.ORG -> {
                        item {
                            Card(
                                colors = CardDefaults.cardColors(containerColor = Color(0xFF111827)),
                                shape = RoundedCornerShape(16.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Text(
                                        text = "Organization Event Publisher & QR Scanner",
                                        color = Color.White,
                                        fontSize = 17.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = "Publish location-based events and scan attendee QR tickets.",
                                        color = Color(0xFF94A3B8),
                                        fontSize = 12.sp,
                                        modifier = Modifier.padding(vertical = 6.dp)
                                    )
                                }
                            }
                        }
                    }

                    AppRole.SUPPORT -> {
                        item {
                            Card(
                                colors = CardDefaults.cardColors(containerColor = Color(0xFF111827)),
                                shape = RoundedCornerShape(16.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Text(
                                        text = "Customer Care Desk (Audio-Only + Live Chat)",
                                        color = Color.White,
                                        fontSize = 17.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = "Handle incoming Audio Support Calls & Chats from Normal Users and Celebrities. Video is disabled.",
                                        color = Color(0xFF94A3B8),
                                        fontSize = 12.sp,
                                        modifier = Modifier.padding(vertical = 6.dp)
                                    )
                                }
                            }
                        }
                    }

                    AppRole.SUPER_ADMIN -> {
                        item {
                            Card(
                                colors = CardDefaults.cardColors(containerColor = Color(0xFF111827)),
                                shape = RoundedCornerShape(16.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Text(
                                        text = "Super Admin — User Restrictions & Moderation",
                                        color = Color.White,
                                        fontSize = 17.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Text("Allow Random Audio Calls", color = Color.White, fontSize = 13.sp)
                                        Switch(checked = allowRandomAudio, onCheckedChange = { allowRandomAudio = it })
                                    }
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Text("Allow Random Video Calls", color = Color.White, fontSize = 13.sp)
                                        Switch(checked = allowRandomVideo, onCheckedChange = { allowRandomVideo = it })
                                    }
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Text("Allow Celebrity Calling", color = Color.White, fontSize = 13.sp)
                                        Switch(checked = allowCelebrityCalls, onCheckedChange = { allowCelebrityCalls = it })
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Active Call Overlay Dialog
            activeCall?.let { call ->
                AlertDialog(
                    onDismissRequest = { activeCall = null },
                    containerColor = Color(0xFF1E293B),
                    title = {
                        Text(
                            text = if (call.videoEnabled && call.videoPermitted) "📹 Live Video Call" else "🎙️ Live Audio Call",
                            color = Color.White,
                            fontWeight = FontWeight.Bold
                        )
                    },
                    text = {
                        Column {
                            Text(text = call.peerName, color = Color.White, fontSize = 15.sp)
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = if (call.videoPermitted) {
                                    "Camera & Microphone WebRTC Stream Active"
                                } else {
                                    "Audio-Only Channel (Video Strictly Disabled)"
                                },
                                color = Color(0xFF94A3B8),
                                fontSize = 12.sp
                            )
                        }
                    },
                    confirmButton = {
                        Button(
                            onClick = { activeCall = null },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE11D48))
                        ) {
                            Text("End Call")
                        }
                    }
                )
            }
        }
    }
}
