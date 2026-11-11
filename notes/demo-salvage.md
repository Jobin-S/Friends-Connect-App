# What we kept from the old 5050 demo

The single-file demo (`docs/index.html`, served on localhost:5050 and GitHub Pages) was removed in Phase 0.
Its signaling (public MQTT broker, PeerJS cloud, BroadcastChannel/localStorage, JPEG-frame and PCM-chunk
"bridges") is **not** reused: it is insecure and is replaced by our backend plus LiveKit.

The full file is still in git history. To read it:

```bash
git show db238da:docs/index.html > /tmp/demo.html
```

The removed later commits (network check, TURN API, redesign) can be read the same way by hash, for example
`git show 18416ce`, for as long as GitHub keeps the unreferenced objects. Copy anything important out early.

## Behaviour to rebuild (Phase 2 onward)

### Call flow and states
- **Caller:** taps call → call screen opens immediately in **Ringing** with a ringback tone. Shows the callee's name, call type
  and, for celebrity calls, the per-minute rate. Cancel button ends the ring.
- **Receiver:** full-screen **incoming call popup** with caller name, phone, type (audio/video), rate, and **Accept** / **Reject**.
  Ringtone plays until answered or cancelled.
- The ring tone stops on **every** device of that user the moment any of them answers ("answered elsewhere").
- Once accepted, both sides show **Connecting → Connected**, a call timer, and for celebrity calls a coins-charged counter.
- Rejecting shows "X rejected the call" to the caller. Hanging up on either side ends it for both.
- A busy receiver (already in a call) auto-rejects new calls.

### Call screen controls
- Mute / unmute microphone.
- Camera on/off (video calls only). The other side sees "X turned off their camera (voice still active)".
- Local camera in a small picture-in-picture; remote video fills the stage; audio-only calls show an avatar.
- Support calls show "Video disabled by policy" instead of a camera button.

### Camera and microphone fallback
If the camera can't be opened (blocked permission or in use by another app/browser), continue the call with
voice only and tell the user why, instead of silently sending no video:
- `NotAllowedError` → "Camera permission is blocked for this site. Allow it in the browser address bar."
- anything else → "Camera is not available (it may be in use by another app or browser)."
If the microphone itself fails, say so explicitly.

### Network check (from commit `18416ce`)
While connecting, show which connection routes each side has found. The route types are:
- `host`: this device's own local address.
- `srflx`: its public internet address, found via STUN.
- `relay`: a TURN server.

If the call fails, keep a "Last call didn't connect" box that explains the likely cause:
- the other device never joined;
- the other device's network details never arrived;
- no relay route on either side, which usually means the Wi-Fi router blocks devices from reaching each other (AP isolation), and a TURN relay fixes it;
- the relay route also failed, which means checking the internet on both devices.

LiveKit exposes equivalent connection-quality and ICE info, so this is rebuilt from that.

### Role screens
- **Celebrity:** "Listening for incoming fan calls" status badge that turns into "Ringing" with inline Accept/Reject;
  earnings counter that increases when a paid call is accepted; publish photo/video posts to their feed.
- **Customer Care agent:** can start an audio-only call to a user or a celebrity; ticket list with live chat.
- **Organization:** publish events with ticket tiers; scan / verify ticket QR codes.
- **Super Admin:** block/unblock, restrict random audio/video/celebrity calls per user.
- **Normal user:** random audio/video match, celebrity directory with audio/video call buttons and rates,
  wallet recharge packs (+300 coins ₹149, +1000 coins ₹399), nearby events filtered by city and radius.

### Seed accounts
These are now in `apps/api/prisma/seed.ts`. In development the OTP is printed to the API console.

| Role | Name | Phone |
|---|---|---|
| Normal user | Arjun Nair | +919876543210 |
| Normal user | Meera Krishnan | +919876543211 |
| Celebrity | Dulquer Sithara | +919999900001 |
| Celebrity | Ananya Menon | +919999900002 |
| Organization | Kochi Live Arena | +919888800001 |
| Customer Care | Rahul — Customer Care | +919777700001 |
| Super Admin | Platform Control | +919000000001 |
