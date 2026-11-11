'use client';

import React, { useState, useRef, useEffect } from 'react';
import { WebRtcCallClient } from '../lib/webrtc-client';

type UserRole = 'NORMAL' | 'CELEBRITY' | 'ORG' | 'SUPPORT' | 'SUPER_ADMIN';

interface UserAccount {
  id: string;
  phoneNumber: string;
  role: UserRole;
  displayName: string;
  status: 'ACTIVE' | 'BLOCKED' | 'RESTRICTED' | 'SUSPENDED';
  restrictions: {
    canRandomAudio: boolean;
    canRandomVideo: boolean;
    canCallCelebrities: boolean;
    maxCallsPerDay: number;
  };
  coinBalance: number;
  earnedCoins: number;
  isPremium: boolean;
}

interface CelebrityItem {
  userId: string;
  displayName: string;
  category: string;
  bio: string;
  avatarUrl: string;
  isVerified: boolean;
  availability: 'ONLINE' | 'BUSY' | 'OFFLINE';
  allowAudioCalls: boolean;
  allowVideoCalls: boolean;
  audioRateCoinsPerMin: number;
  videoRateCoinsPerMin: number;
  followersCount: number;
  media: Array<{
    id: string;
    mediaType: 'PHOTO' | 'VIDEO';
    mediaUrl: string;
    caption: string;
    likesCount: number;
  }>;
}

interface EventItem {
  id: string;
  orgId: string;
  orgName: string;
  title: string;
  description: string;
  venueName: string;
  city: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  startTime: string;
  ticketTiers: Array<{
    id: string;
    name: string;
    priceFiat: number;
    totalCapacity: number;
    soldCount: number;
  }>;
}

interface ActiveCallSession {
  callId: string;
  callType: 'RANDOM_AUDIO' | 'RANDOM_VIDEO' | 'CELEB_AUDIO' | 'CELEB_VIDEO' | 'SUPPORT_AUDIO';
  peerName: string;
  peerSubtitle: string;
  videoEnabled: boolean;
  videoPermitted: boolean;
  rateCoinsPerMin: number;
  elapsedSeconds: number;
  coinsCharged: number;
  muted: boolean;
}

export default function FriendsConnectApp() {
  // 1. Auth & Role State
  const [activeRole, setActiveRole] = useState<UserRole>('NORMAL');
  const [phoneInput, setPhoneInput] = useState('+91 98765 43210');
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('123456');
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 2. Platform Data State
  const [users, setUsers] = useState<UserAccount[]>([
    {
      id: 'usr-normal-1',
      phoneNumber: '+91 98765 43210',
      role: 'NORMAL',
      displayName: 'Arjun Nair',
      status: 'ACTIVE',
      restrictions: {
        canRandomAudio: true,
        canRandomVideo: true,
        canCallCelebrities: true,
        maxCallsPerDay: 50,
      },
      coinBalance: 650,
      earnedCoins: 0,
      isPremium: true,
    },
    {
      id: 'usr-normal-2',
      phoneNumber: '+91 98765 43211',
      role: 'NORMAL',
      displayName: 'Meera Krishnan',
      status: 'ACTIVE',
      restrictions: {
        canRandomAudio: true,
        canRandomVideo: true,
        canCallCelebrities: true,
        maxCallsPerDay: 50,
      },
      coinBalance: 180,
      earnedCoins: 0,
      isPremium: false,
    },
    {
      id: 'usr-celeb-1',
      phoneNumber: '+91 99999 00001',
      role: 'CELEBRITY',
      displayName: 'Dulquer Sithara',
      status: 'ACTIVE',
      restrictions: {
        canRandomAudio: true,
        canRandomVideo: true,
        canCallCelebrities: true,
        maxCallsPerDay: 100,
      },
      coinBalance: 1000,
      earnedCoins: 14500,
      isPremium: true,
    },
  ]);

  const currentUser = users[0];

  const [celebrities, setCelebrities] = useState<CelebrityItem[]>([
    {
      userId: 'usr-celeb-1',
      displayName: 'Dulquer Sithara',
      category: 'Cinema & Pan-Indian Actor',
      bio: 'Connecting directly with fans via live 1:1 Audio & Video calls! Check out my latest behind-the-scenes clips below.',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      isVerified: true,
      availability: 'ONLINE',
      allowAudioCalls: true,
      allowVideoCalls: true,
      audioRateCoinsPerMin: 60,
      videoRateCoinsPerMin: 150,
      followersCount: 128400,
      media: [
        {
          id: 'med-1',
          mediaType: 'PHOTO',
          mediaUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800',
          caption: 'Evening shoot wrap at Fort Kochi waterfront!',
          likesCount: 4320,
        },
        {
          id: 'med-2',
          mediaType: 'VIDEO',
          mediaUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
          caption: 'Exclusive teaser before tonight’s fan Video Call session!',
          likesCount: 8910,
        },
      ],
    },
    {
      userId: 'usr-celeb-2',
      displayName: 'Ananya Menon',
      category: 'Playback Singer & Indie Pop',
      bio: 'Live acoustic requests & fan chats! Available for both Audio and Video calls.',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
      isVerified: true,
      availability: 'ONLINE',
      allowAudioCalls: true,
      allowVideoCalls: true,
      audioRateCoinsPerMin: 40,
      videoRateCoinsPerMin: 100,
      followersCount: 84500,
      media: [
        {
          id: 'med-3',
          mediaType: 'PHOTO',
          mediaUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
          caption: 'Studio rehearsal session in Trivandrum!',
          likesCount: 2150,
        },
      ],
    },
  ]);

  const [selectedCity, setSelectedCity] = useState<'ALL' | 'Kochi' | 'Kozhikode' | 'Trivandrum'>('ALL');
  const [maxRadiusKm, setMaxRadiusKm] = useState<number>(100);
  const [events, setEvents] = useState<EventItem[]>([
    {
      id: 'evt-1',
      orgId: 'usr-org-1',
      orgName: 'Kochi Live Arena Events Pvt Ltd',
      title: 'Kochi Sunset Music & Indie Fest 2026',
      description: 'Open-air live concert featuring top bands, celebrity meetups, and food carnival.',
      venueName: 'Bolgatty Palace Grounds',
      city: 'Kochi',
      latitude: 9.9816,
      longitude: 76.2673,
      distanceKm: 4.2,
      startTime: '2026-11-15T17:30:00',
      ticketTiers: [
        { id: 't-1', name: 'General Access', priceFiat: 499, totalCapacity: 500, soldCount: 312 },
        { id: 't-2', name: 'VIP Fan Pit', priceFiat: 1499, totalCapacity: 100, soldCount: 74 },
      ],
    },
    {
      id: 'evt-2',
      orgId: 'usr-org-1',
      orgName: 'Kochi Live Arena Events Pvt Ltd',
      title: 'Malabar Creators & Tech Conclave',
      description: 'Meet digital creators, filmmakers, and music artists at Calicut Beach Arena.',
      venueName: 'Calicut Trade Centre',
      city: 'Kozhikode',
      latitude: 11.2588,
      longitude: 75.7804,
      distanceKm: 42.8,
      startTime: '2026-11-22T10:00:00',
      ticketTiers: [
        { id: 't-3', name: 'Standard Pass', priceFiat: 299, totalCapacity: 300, soldCount: 140 },
        { id: 't-4', name: 'Creator VIP Lounge', priceFiat: 999, totalCapacity: 50, soldCount: 29 },
      ],
    },
  ]);

  const [bookedTickets, setBookedTickets] = useState<
    Array<{ id: string; eventTitle: string; tierName: string; qrHash: string; price: number }>
  >([
    {
      id: 'bkg-101',
      eventTitle: 'Kochi Sunset Music & Indie Fest 2026',
      tierName: 'VIP Fan Pit',
      qrHash: 'FC-QR-98A7F2C10E',
      price: 1499,
    },
  ]);

  const [supportMessages, setSupportMessages] = useState<
    Array<{ id: string; sender: string; role: string; text: string; time: string }>
  >([
    {
      id: 'm1',
      sender: 'Rahul (Customer Care Support)',
      role: 'SUPPORT',
      text: 'Welcome to Friends Connect 24x7 Support! Normal Users & Celebrities can chat or start an Audio-Only Support Call anytime.',
      time: '10:15 AM',
    },
  ]);
  const [chatDraft, setChatDraft] = useState('');

  // Organization new event form
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventCity, setNewEventCity] = useState('Kochi');
  const [newEventVenue, setNewEventVenue] = useState('');
  const [newEventPrice, setNewEventPrice] = useState(499);

  // Celebrity new media form
  const [newMediaType, setNewMediaType] = useState<'PHOTO' | 'VIDEO'>('PHOTO');
  const [newMediaCaption, setNewMediaCaption] = useState('');
  const [newMediaUrl, setNewMediaUrl] = useState(
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800',
  );

  // Active Call Modal, Timer & Native WebRTC Engine
  const [activeCall, setActiveCall] = useState<ActiveCallSession | null>(null);
  const [rtcConnectionState, setRtcConnectionState] = useState<string>('new');
  const callDialogRef = useRef<HTMLDialogElement | null>(null);
  const webrtcClientRef = useRef<WebRtcCallClient | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const notify = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    if (!activeCall) {
      webrtcClientRef.current?.stopCall();
      webrtcClientRef.current = null;
      setRtcConnectionState('closed');
      if (callDialogRef.current?.open) {
        callDialogRef.current.close();
      }
      return;
    }

    if (callDialogRef.current && !callDialogRef.current.open) {
      callDialogRef.current.showModal();
    }

    // Initialize real W3C WebRTC PeerConnection & getUserMedia stream when a new call starts
    if (!webrtcClientRef.current) {
      const client = new WebRtcCallClient();
      webrtcClientRef.current = client;
      setRtcConnectionState('connecting');

      client.startCall({
        roomName: activeCall.callId,
        userId: currentUser.id,
        displayName: currentUser.displayName,
        callMode: activeCall.callType,
        callbacks: {
          onLocalStream: (stream) => {
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
            }
          },
          onRemoteStream: (stream) => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = stream;
            }
            if (remoteAudioRef.current) {
              remoteAudioRef.current.srcObject = stream;
            }
          },
          onConnectionStateChange: (state) => {
            setRtcConnectionState(state);
          },
          onError: (msg) => {
            notify(msg);
          },
        },
      });
    }

    const timer = setInterval(() => {
      setActiveCall((prev) => {
        if (!prev) return null;
        const nextSec = prev.elapsedSeconds + 1;
        // Per-minute metering check for celebrity calls every 60s
        if (prev.rateCoinsPerMin > 0 && nextSec % 60 === 0) {
          setUsers((uList) =>
            uList.map((u, idx) =>
              idx === 0 ? { ...u, coinBalance: Math.max(0, u.coinBalance - prev.rateCoinsPerMin) } : u,
            ),
          );
          return {
            ...prev,
            elapsedSeconds: nextSec,
            coinsCharged: prev.coinsCharged + prev.rateCoinsPerMin,
          };
        }
        return { ...prev, elapsedSeconds: nextSec };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeCall, currentUser.id, currentUser.displayName]);

  // Call Starters enforcing the exact Call Matrix
  const startRandomMatchCall = (mode: 'AUDIO' | 'VIDEO') => {
    if (currentUser.status !== 'ACTIVE') {
      notify(`Account is ${currentUser.status}. Contact Customer Care Support.`);
      return;
    }
    if (mode === 'AUDIO' && !currentUser.restrictions.canRandomAudio) {
      notify('Super Admin has restricted Random Audio Calls on your account.');
      return;
    }
    if (mode === 'VIDEO' && !currentUser.restrictions.canRandomVideo) {
      notify('Super Admin has restricted Random Video Calls on your account.');
      return;
    }

    setActiveCall({
      callId: `rnd-${Date.now()}`,
      callType: mode === 'VIDEO' ? 'RANDOM_VIDEO' : 'RANDOM_AUDIO',
      peerName: 'Meera Krishnan (Matched Online Friend)',
      peerSubtitle:
        mode === 'VIDEO'
          ? 'Random 1:1 Video Call • Encrypted WebRTC'
          : 'Random 1:1 Audio Call • Encrypted WebRTC',
      videoEnabled: mode === 'VIDEO',
      videoPermitted: true,
      rateCoinsPerMin: 0,
      elapsedSeconds: 0,
      coinsCharged: 0,
      muted: false,
    });
  };

  const startCelebrityCall = (celeb: CelebrityItem, mode: 'AUDIO' | 'VIDEO') => {
    if (!currentUser.restrictions.canCallCelebrities) {
      notify('Super Admin has restricted Celebrity Calls on your account.');
      return;
    }
    const rate = mode === 'VIDEO' ? celeb.videoRateCoinsPerMin : celeb.audioRateCoinsPerMin;
    if (currentUser.coinBalance < rate) {
      notify(
        `Insufficient Wallet Coins! Need ${rate} coins/min for ${mode} call with ${celeb.displayName}. Recharge your wallet first.`,
      );
      return;
    }

    // Deduct 1st minute upfront
    setUsers((prev) => prev.map((u, idx) => (idx === 0 ? { ...u, coinBalance: u.coinBalance - rate } : u)));

    setActiveCall({
      callId: `celeb-${Date.now()}`,
      callType: mode === 'VIDEO' ? 'CELEB_VIDEO' : 'CELEB_AUDIO',
      peerName: `${celeb.displayName} (Verified Celebrity)`,
      peerSubtitle: `Premium Celebrity ${mode} Call • ${rate} Coins/min`,
      videoEnabled: mode === 'VIDEO',
      videoPermitted: mode === 'VIDEO',
      rateCoinsPerMin: rate,
      elapsedSeconds: 0,
      coinsCharged: rate,
      muted: false,
    });
  };

  const startCustomerCareAudioCall = (callerLabel: string) => {
    // Strictly Audio-Only — Video is NEVER allowed with Customer Care Support
    setActiveCall({
      callId: `sup-${Date.now()}`,
      callType: 'SUPPORT_AUDIO',
      peerName: 'Rahul — Customer Care Support Desk',
      peerSubtitle: `Audio-Only Support Call (${callerLabel}) • Video Disabled by Policy`,
      videoEnabled: false,
      videoPermitted: false,
      rateCoinsPerMin: 0,
      elapsedSeconds: 0,
      coinsCharged: 0,
      muted: false,
    });
  };

  const filteredEvents = events.filter(
    (e) => (selectedCity === 'ALL' || e.city === selectedCity) && e.distanceKm <= maxRadiusKm,
  );

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      {/* Top Navigation & Multi-Role Switcher */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-[#0d1322]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-600/30">
              FC
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight flex items-center gap-2">
                Friends Connect
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Web + Android + iOS
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Random Audio & Video Calls • Celebrity Connect • Geo-Events • Support
              </p>
            </div>
          </div>

          {/* Role Switcher Bar */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800">
            {(
              [
                { id: 'NORMAL', label: '1. Normal User' },
                { id: 'CELEBRITY', label: '2. Celebrity Account' },
                { id: 'ORG', label: '3. Organization (Events)' },
                { id: 'SUPPORT', label: '4. Customer Care' },
                { id: 'SUPER_ADMIN', label: '5. Super Admin' },
              ] as Array<{ id: UserRole; label: string }>
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveRole(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeRole === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Wallet & OTP Login Status */}
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              🪙 {currentUser.coinBalance} Coins
            </div>
            <button
              onClick={() => setIsLoggedIn(!isLoggedIn)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700"
            >
              {isLoggedIn ? `📱 ${currentUser.phoneNumber}` : 'Login via OTP'}
            </button>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-blue-600 text-white px-4 py-3 rounded-xl shadow-2xl border border-blue-400 text-sm font-medium">
          {toastMessage}
        </div>
      )}

      {/* Mobile OTP Login Banner (if logged out) */}
      {!isLoggedIn && (
        <section className="max-w-md mx-auto my-12 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <h2 className="text-xl font-bold mb-2">Mobile Number OTP Login</h2>
          <p className="text-xs text-slate-400 mb-4">
            Sign in or create your Friends Connect account using your mobile number and 6-digit OTP.
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Mobile Number</label>
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
              />
            </div>
            {otpSent && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Enter 6-Digit OTP</label>
                <input
                  type="text"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm tracking-widest"
                />
              </div>
            )}
            <button
              onClick={() => {
                if (!otpSent) {
                  setOtpSent(true);
                  notify('OTP 123456 sent to your mobile number!');
                } else {
                  setIsLoggedIn(true);
                  setOtpSent(false);
                  notify('Logged in successfully via Mobile OTP!');
                }
              }}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 font-semibold text-sm"
            >
              {otpSent ? 'Verify OTP & Continue' : 'Send OTP'}
            </button>
          </div>
        </section>
      )}

      {/* Main Content Area by Active Role */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 space-y-8">
        {/* =====================================================================
            ROLE 1: NORMAL USER WORKSPACE
           ===================================================================== */}
        {activeRole === 'NORMAL' && (
          <div className="space-y-8">
            {/* Hero 1: Random Friend Audio & Video Call Matchmaking */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 p-6 rounded-2xl bg-gradient-to-br from-blue-950/80 via-slate-900 to-indigo-950/60 border border-blue-500/30 flex flex-col justify-between">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-3">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    1,420 Friends Online Right Now
                  </span>
                  <h2 className="text-2xl font-bold mb-2">
                    Connect with Random Friends — Audio or Video Call
                  </h2>
                  <p className="text-sm text-slate-300 max-w-2xl">
                    Tap below to join the real-time matchmaking queue. Connect immediately with another online
                    user for a 1:1 live <strong>Audio Call</strong> or <strong>Video Call</strong>. Phone
                    numbers stay 100% private.
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <button
                    onClick={() => startRandomMatchCall('AUDIO')}
                    className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 flex items-center gap-2"
                  >
                    🎙️ Start Random Audio Call
                  </button>
                  <button
                    onClick={() => startRandomMatchCall('VIDEO')}
                    className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/30 flex items-center gap-2"
                  >
                    📹 Start Random Video Call
                  </button>
                  <button
                    onClick={() => startCustomerCareAudioCall('Normal User')}
                    className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700"
                  >
                    🎧 Call Customer Care (Audio-Only)
                  </button>
                </div>
              </div>

              {/* Premium Wallet Recharge Card */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-base">Premium & Wallet Coins</h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">
                      {currentUser.isPremium ? 'VIP PREMIUM ACTIVE' : 'STANDARD'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">
                    Use coins to place 1:1 Audio or Video calls to Verified Celebrities.
                  </p>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 mb-4 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Available Balance</span>
                    <span className="text-xl font-bold text-amber-400">
                      🪙 {currentUser.coinBalance} Coins
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setUsers((prev) =>
                        prev.map((u, i) =>
                          i === 0 ? { ...u, coinBalance: u.coinBalance + 300, isPremium: true } : u,
                        ),
                      );
                      notify('Recharged +300 Wallet Coins (₹149)! Celebrity Audio & Video calling unlocked.');
                    }}
                    className="py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                  >
                    +300 Coins (₹149)
                  </button>
                  <button
                    onClick={() => {
                      setUsers((prev) =>
                        prev.map((u, i) =>
                          i === 0 ? { ...u, coinBalance: u.coinBalance + 1000, isPremium: true } : u,
                        ),
                      );
                      notify('Recharged +1,000 VIP Coins (₹399)!');
                    }}
                    className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold text-xs"
                  >
                    +1000 Coins (₹399)
                  </button>
                </div>
              </div>
            </div>

            {/* Section 2: Celebrities Feed & Direct Audio/Video Calling */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Verified Celebrities — Photos, Videos & Live Calls</h2>
                  <p className="text-xs text-slate-400">
                    Explore celebrity posts and connect directly via Premium Audio Call or Video Call
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {celebrities.map((celeb) => (
                  <div
                    key={celeb.userId}
                    className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col justify-between"
                  >
                    <div className="p-5 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={celeb.avatarUrl}
                            alt={celeb.displayName}
                            className="h-14 w-14 rounded-2xl object-cover border border-blue-500/40"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-bold text-base">{celeb.displayName}</h3>
                              <span className="text-blue-400 text-xs" title="Verified Celebrity">
                                ✔
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">{celeb.category}</p>
                            <span
                              className={`inline-block mt-1 text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                                celeb.availability === 'ONLINE'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-amber-500/20 text-amber-300'
                              }`}
                            >
                              ● {celeb.availability}
                            </span>
                          </div>
                        </div>

                        <div className="text-right text-xs text-slate-400">
                          <div>{(celeb.followersCount / 1000).toFixed(1)}K Followers</div>
                          <div className="text-amber-300 font-medium mt-1">
                            🎙️ {celeb.audioRateCoinsPerMin}c/m • 📹 {celeb.videoRateCoinsPerMin}c/m
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">{celeb.bio}</p>

                      {/* Celebrity Media Gallery */}
                      <div className="grid grid-cols-2 gap-2.5 pt-1">
                        {celeb.media.map((m) => (
                          <div
                            key={m.id}
                            className="group relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800"
                          >
                            <img
                              src={m.mediaUrl}
                              alt={m.caption}
                              className="h-32 w-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <span className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded bg-black/70 text-white font-semibold">
                              {m.mediaType === 'VIDEO' ? '▶ VIDEO' : '📷 PHOTO'}
                            </span>
                            <div className="p-2">
                              <p className="text-[11px] text-slate-300 line-clamp-1">{m.caption}</p>
                              <span className="text-[10px] text-slate-400">❤️ {m.likesCount}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Call Actions Footer */}
                    <div className="p-4 bg-slate-950/70 border-t border-slate-800 flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => startCelebrityCall(celeb, 'AUDIO')}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs text-center"
                      >
                        🎙️ Audio Call ({celeb.audioRateCoinsPerMin} Coins/min)
                      </button>
                      <button
                        onClick={() => startCelebrityCall(celeb, 'VIDEO')}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-xs text-center"
                      >
                        📹 Video Call ({celeb.videoRateCoinsPerMin} Coins/min)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 3: Location-Based Events & Ticket Booking */}
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">Location-Based Events Near You</h2>
                  <p className="text-xs text-slate-400">
                    Filtered automatically using your GPS coordinates & radius
                  </p>
                </div>

                {/* Location & Radius Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  {(['ALL', 'Kochi', 'Kozhikode'] as const).map((city) => (
                    <button
                      key={city}
                      onClick={() => setSelectedCity(city)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                        selectedCity === city
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      📍 {city === 'ALL' ? 'All Nearby Cities' : city}
                    </button>
                  ))}
                  <select
                    value={maxRadiusKm}
                    onChange={(e) => setMaxRadiusKm(Number(e.target.value))}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
                  >
                    <option value={10}>Within 10 km</option>
                    <option value={50}>Within 50 km</option>
                    <option value={100}>Within 100 km</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-blue-400 font-semibold mb-1">
                        <span>🏢 {ev.orgName}</span>
                        <span>
                          📍 {ev.distanceKm} km away • {ev.city}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold">{ev.title}</h3>
                      <p className="text-xs text-slate-400 mt-1">{ev.description}</p>
                      <div className="mt-3 text-xs text-slate-300 space-y-1">
                        <div>🏟️ Venue: {ev.venueName}</div>
                        <div>🗓️ Starts: {new Date(ev.startTime).toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-slate-800">
                      <div className="text-xs font-semibold text-slate-400">Select Ticket Tier:</div>
                      {ev.ticketTiers.map((tier) => (
                        <div
                          key={tier.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800"
                        >
                          <div>
                            <div className="text-xs font-bold">{tier.name}</div>
                            <div className="text-[11px] text-slate-400">
                              ₹{tier.priceFiat} • {tier.totalCapacity - tier.soldCount} seats left
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              const newTicket = {
                                id: `bkg-${Date.now()}`,
                                eventTitle: ev.title,
                                tierName: tier.name,
                                qrHash: `FC-QR-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
                                price: tier.priceFiat,
                              };
                              setBookedTickets((prev) => [newTicket, ...prev]);
                              notify(`Booked ${tier.name} ticket for ${ev.title}! QR Pass generated.`);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs"
                          >
                            Book Ticket (₹{tier.priceFiat})
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* User's Booked QR Tickets */}
              {bookedTickets.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <h3 className="text-sm font-bold mb-3">🎟️ My Booked Event Passes (QR Codes)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {bookedTickets.map((t) => (
                      <div
                        key={t.id}
                        className="p-3 rounded-xl bg-slate-950 border border-emerald-500/30 flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-100">{t.eventTitle}</div>
                          <div className="text-[11px] text-emerald-400">
                            {t.tierName} • Paid ₹{t.price}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mt-1">QR: {t.qrHash}</div>
                        </div>
                        <div className="h-10 w-10 rounded bg-white text-slate-950 flex items-center justify-center font-mono text-[10px] font-bold">
                          QR
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {/* =====================================================================
            ROLE 2: CELEBRITY ACCOUNT WORKSPACE
           ===================================================================== */}
        {activeRole === 'CELEBRITY' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Call Rate & Availability Console */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
              <div className="flex items-center gap-3">
                <img
                  src={celebrities[0].avatarUrl}
                  alt={celebrities[0].displayName}
                  className="h-14 w-14 rounded-2xl object-cover"
                />
                <div>
                  <h2 className="font-bold text-lg">{celebrities[0].displayName}</h2>
                  <span className="text-xs text-blue-400">✔ Verified Celebrity Studio</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-xs text-slate-400">Total Celebrity Call Earnings</div>
                <div className="text-2xl font-bold text-emerald-400 mt-1">🪙 14,500 Earned Coins</div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-300">
                  Live Call Availability Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['ONLINE', 'BUSY', 'OFFLINE'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        setCelebrities((prev) =>
                          prev.map((c, idx) => (idx === 0 ? { ...c, availability: st } : c)),
                        );
                        notify(`Celebrity status updated to ${st}`);
                      }}
                      className={`py-2 rounded-lg text-xs font-bold border ${
                        celebrities[0].availability === st
                          ? 'bg-emerald-600 border-emerald-400 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Audio & Video Call Rates (Coins / Min)
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-xs">🎙️ Audio Call Rate (Coins/min)</span>
                  <input
                    type="number"
                    value={celebrities[0].audioRateCoinsPerMin}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setCelebrities((prev) =>
                        prev.map((c, i) => (i === 0 ? { ...c, audioRateCoinsPerMin: val } : c)),
                      );
                    }}
                    className="w-24 px-2 py-1 rounded bg-slate-950 border border-slate-700 text-sm text-right"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs">📹 Video Call Rate (Coins/min)</span>
                  <input
                    type="number"
                    value={celebrities[0].videoRateCoinsPerMin}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setCelebrities((prev) =>
                        prev.map((c, i) => (i === 0 ? { ...c, videoRateCoinsPerMin: val } : c)),
                      );
                    }}
                    className="w-24 px-2 py-1 rounded bg-slate-950 border border-slate-700 text-sm text-right"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-2">
                <button
                  onClick={() => startCustomerCareAudioCall('Celebrity VIP')}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold border border-slate-700"
                >
                  🎧 Call VIP Customer Care (Audio-Only)
                </button>
              </div>
            </div>

            {/* Celebrity Photo & Video Upload Studio */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
              <h3 className="text-lg font-bold">Upload Exclusive Photos & Videos for Fans</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Media Type</label>
                  <select
                    value={newMediaType}
                    onChange={(e) => setNewMediaType(e.target.value as 'PHOTO' | 'VIDEO')}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs"
                  >
                    <option value="PHOTO">📷 Photo Post</option>
                    <option value="VIDEO">▶ Short Video</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-slate-400 mb-1">Media URL</label>
                  <input
                    type="text"
                    value={newMediaUrl}
                    onChange={(e) => setNewMediaUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Caption</label>
                <input
                  type="text"
                  placeholder="Share an update with your fans..."
                  value={newMediaCaption}
                  onChange={(e) => setNewMediaCaption(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs"
                />
              </div>
              <button
                onClick={() => {
                  if (!newMediaCaption) {
                    notify('Please enter a caption for your post');
                    return;
                  }
                  const item = {
                    id: `med-${Date.now()}`,
                    mediaType: newMediaType,
                    mediaUrl: newMediaUrl,
                    caption: newMediaCaption,
                    likesCount: 1,
                  };
                  setCelebrities((prev) =>
                    prev.map((c, idx) => (idx === 0 ? { ...c, media: [item, ...c.media] } : c)),
                  );
                  setNewMediaCaption('');
                  notify(`Published new ${newMediaType} to your Celebrity Feed!`);
                }}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold"
              >
                Publish to Fan Feed
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                {celebrities[0].media.map((m) => (
                  <div key={m.id} className="rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                    <img src={m.mediaUrl} alt={m.caption} className="h-40 w-full object-cover" />
                    <div className="p-3">
                      <span className="text-[10px] font-bold text-blue-400">{m.mediaType}</span>
                      <p className="text-xs text-slate-200 mt-1">{m.caption}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            ROLE 3: ORGANIZATION WORKSPACE (EVENT MANAGEMENT & TICKETING)
           ===================================================================== */}
        {activeRole === 'ORG' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h2 className="text-lg font-bold">Publish New Location-Based Event</h2>
              <p className="text-xs text-slate-400">
                Events are indexed with GPS coordinates so nearby users discover them automatically.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Event Title</label>
                  <input
                    type="text"
                    placeholder="e.g., Trivandrum Techno Night 2026"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">City</label>
                    <select
                      value={newEventCity}
                      onChange={(e) => setNewEventCity(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs"
                    >
                      <option value="Kochi">Kochi</option>
                      <option value="Kozhikode">Kozhikode</option>
                      <option value="Trivandrum">Trivandrum</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Ticket Price (₹)</label>
                    <input
                      type="number"
                      value={newEventPrice}
                      onChange={(e) => setNewEventPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Venue Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Greenfield International Stadium"
                    value={newEventVenue}
                    onChange={(e) => setNewEventVenue(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs"
                  />
                </div>
                <button
                  onClick={() => {
                    if (!newEventTitle || !newEventVenue) {
                      notify('Please fill in Event Title and Venue');
                      return;
                    }
                    const created: EventItem = {
                      id: `evt-${Date.now()}`,
                      orgId: 'usr-org-1',
                      orgName: 'Kochi Live Arena Events Pvt Ltd',
                      title: newEventTitle,
                      description: 'Official organization event listed on Friends Connect.',
                      venueName: newEventVenue,
                      city: newEventCity,
                      latitude: 8.5241,
                      longitude: 76.9366,
                      distanceKm: 6.5,
                      startTime: new Date(Date.now() + 86400_000 * 5).toISOString(),
                      ticketTiers: [
                        {
                          id: `tier-${Date.now()}`,
                          name: 'Standard Entry Pass',
                          priceFiat: newEventPrice,
                          totalCapacity: 250,
                          soldCount: 0,
                        },
                      ],
                    };
                    setEvents((prev) => [created, ...prev]);
                    setNewEventTitle('');
                    setNewEventVenue('');
                    notify(`Published event "${created.title}" in ${created.city}!`);
                  }}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                >
                  Publish Event & Open Ticket Sales
                </button>
              </div>
            </div>

            <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h2 className="text-lg font-bold">Organization Published Events & Ticket Sales</h2>
              <div className="space-y-3">
                {events.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4"
                  >
                    <div>
                      <span className="text-[11px] text-blue-400 font-semibold">
                        📍 {ev.city} • {ev.venueName}
                      </span>
                      <h3 className="font-bold text-sm">{ev.title}</h3>
                      <div className="text-xs text-slate-400 mt-1">
                        {ev.ticketTiers.map((t) => (
                          <span key={t.id} className="mr-4">
                            {t.name}:{' '}
                            <strong>
                              {t.soldCount}/{t.totalCapacity} sold
                            </strong>{' '}
                            (₹{t.priceFiat})
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-300 font-semibold">
                      PUBLISHED
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            ROLE 4: CUSTOMER CARE SUPPORT DESK (AUDIO CALL + CHAT ONLY)
           ===================================================================== */}
        {activeRole === 'SUPPORT' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 font-semibold">
                Strict Audio-Only + Chat Policy
              </span>
              <h2 className="text-lg font-bold">Customer Care Support Queue</h2>
              <p className="text-xs text-slate-400">
                Receive and place Support Audio Calls & Live Chats with Normal Users and Celebrities. Video
                calling is permanently disabled on support channels.
              </p>

              <div className="space-y-2.5 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300">★ VIP CELEBRITY TICKET</span>
                    <span className="text-[10px] text-slate-400">Dulquer Sithara</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Payout bank settlement verification for October earnings
                  </p>
                  <button
                    onClick={() => startCustomerCareAudioCall('Agent -> Celebrity Dulquer Sithara')}
                    className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold"
                  >
                    🎙️ Start Audio Call with Celebrity
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">NORMAL USER TICKET</span>
                    <span className="text-[10px] text-slate-400">Arjun Nair</span>
                  </div>
                  <p className="text-xs text-slate-300">Event QR ticket download query</p>
                  <button
                    onClick={() => startCustomerCareAudioCall('Agent -> User Arjun Nair')}
                    className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold"
                  >
                    🎙️ Start Audio Call with User
                  </button>
                </div>
              </div>
            </div>

            {/* Live Two-Way Support Chat */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between h-[480px]">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="font-bold text-sm">Omnichannel Customer Care Live Chat</h3>
                    <p className="text-xs text-slate-400">
                      Connected with Normal Users & Celebrities (Audio Call & Chat enabled; Video disabled)
                    </p>
                  </div>
                  <button
                    onClick={() => startCustomerCareAudioCall('Live Chat Escalation')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold"
                  >
                    🎙️ Audio Call Only
                  </button>
                </div>

                <div className="py-4 space-y-3 overflow-y-auto max-h-[300px]">
                  {supportMessages.map((m) => (
                    <div key={m.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="font-bold text-blue-400">{m.sender}</span>
                        <span>{m.time}</span>
                      </div>
                      <p className="text-slate-200">{m.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                <input
                  type="text"
                  placeholder="Type a support message to User or Celebrity..."
                  value={chatDraft}
                  onChange={(e) => setChatDraft(e.target.value)}
                  className="flex-1 px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs"
                />
                <button
                  onClick={() => {
                    if (!chatDraft.trim()) return;
                    setSupportMessages((prev) => [
                      ...prev,
                      {
                        id: `m-${Date.now()}`,
                        sender: 'Customer Care Desk',
                        role: 'SUPPORT',
                        text: chatDraft,
                        time: 'Just now',
                      },
                    ]);
                    setChatDraft('');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold"
                >
                  Send Reply
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            ROLE 5: SUPER ADMIN COMMAND CENTER (PLATFORM CONTROL & RESTRICTIONS)
           ===================================================================== */}
        {activeRole === 'SUPER_ADMIN' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <h2 className="text-xl font-bold mb-1">
                Super Admin — Platform Control, Blocks & Granular Call Restrictions
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                Block or suspend accounts, or selectively restrict Random Audio Calls, Random Video Calls, or
                Celebrity Calling per user. Changes take effect immediately across Normal User & Celebrity
                tabs.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-3 px-3">User / Phone</th>
                      <th className="py-3 px-3">Role</th>
                      <th className="py-3 px-3">Account Status</th>
                      <th className="py-3 px-3">Random Audio</th>
                      <th className="py-3 px-3">Random Video</th>
                      <th className="py-3 px-3">Celebrity Calls</th>
                      <th className="py-3 px-3">Quick Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-950/60">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-100">{u.displayName}</div>
                          <div className="text-slate-400">{u.phoneNumber}</div>
                        </td>
                        <td className="py-3 px-3 font-semibold text-blue-400">{u.role}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold ${
                              u.status === 'ACTIVE'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <input
                            type="checkbox"
                            checked={u.restrictions.canRandomAudio}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setUsers((prev) =>
                                prev.map((item) =>
                                  item.id === u.id
                                    ? {
                                        ...item,
                                        restrictions: { ...item.restrictions, canRandomAudio: checked },
                                      }
                                    : item,
                                ),
                              );
                              notify(`Updated Random Audio permission for ${u.displayName}`);
                            }}
                          />
                        </td>
                        <td className="py-3 px-3">
                          <input
                            type="checkbox"
                            checked={u.restrictions.canRandomVideo}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setUsers((prev) =>
                                prev.map((item) =>
                                  item.id === u.id
                                    ? {
                                        ...item,
                                        restrictions: { ...item.restrictions, canRandomVideo: checked },
                                      }
                                    : item,
                                ),
                              );
                              notify(`Updated Random Video permission for ${u.displayName}`);
                            }}
                          />
                        </td>
                        <td className="py-3 px-3">
                          <input
                            type="checkbox"
                            checked={u.restrictions.canCallCelebrities}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setUsers((prev) =>
                                prev.map((item) =>
                                  item.id === u.id
                                    ? {
                                        ...item,
                                        restrictions: {
                                          ...item.restrictions,
                                          canCallCelebrities: checked,
                                        },
                                      }
                                    : item,
                                ),
                              );
                              notify(`Updated Celebrity Call permission for ${u.displayName}`);
                            }}
                          />
                        </td>
                        <td className="py-3 px-3">
                          <button
                            onClick={() => {
                              const nextStatus = u.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
                              setUsers((prev) =>
                                prev.map((item) =>
                                  item.id === u.id ? { ...item, status: nextStatus } : item,
                                ),
                              );
                              notify(`${u.displayName} is now ${nextStatus}`);
                            }}
                            className={`px-3 py-1 rounded-lg font-semibold ${
                              u.status === 'ACTIVE'
                                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            }`}
                          >
                            {u.status === 'ACTIVE' ? 'Block User' : 'Unblock User'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* =====================================================================
          NATIVE HTML <dialog> FOR LIVE AUDIO & VIDEO CALLS
         ===================================================================== */}
      <dialog
        ref={callDialogRef}
        onClose={() => setActiveCall(null)}
        className="w-full max-w-lg rounded-3xl bg-slate-900 text-slate-100 border border-slate-700 p-0 shadow-2xl overflow-hidden"
      >
        {activeCall && (
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
                  ● LIVE {activeCall.callType.replace('_', ' ')}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 font-mono">
                  WebRTC: {rtcConnectionState}
                </span>
              </div>
              <span className="font-mono text-sm font-bold text-slate-300">
                {Math.floor(activeCall.elapsedSeconds / 60)
                  .toString()
                  .padStart(2, '0')}
                :{(activeCall.elapsedSeconds % 60).toString().padStart(2, '0')}
              </span>
            </div>

            {/* Hidden WebRTC Remote Audio Renderer for all calls */}
            <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

            {/* WebRTC Video / Audio Stage */}
            <div className="relative h-64 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center overflow-hidden">
              {activeCall.videoEnabled && activeCall.videoPermitted ? (
                <div className="w-full h-full bg-gradient-to-tr from-indigo-950 via-slate-900 to-purple-950 flex flex-col items-center justify-center relative">
                  {/* Remote Peer WebRTC Video Element */}
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover opacity-85"
                  />
                  <div className="relative z-10 text-center pointer-events-none">
                    <div className="font-bold text-base drop-shadow">{activeCall.peerName}</div>
                    <div className="text-xs text-slate-300 drop-shadow">
                      P2P WebRTC SRTP Video + Opus Audio Stream
                    </div>
                  </div>
                  {/* Local Self Camera PiP WebRTC Video Element */}
                  <div className="absolute bottom-3 right-3 h-24 w-32 rounded-xl bg-slate-900 border border-blue-500/50 overflow-hidden shadow-lg">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 left-1.5 text-[9px] px-1.5 py-0.5 rounded bg-black/70 text-white">
                      You (WebRTC Cam)
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-4">
                  <div className="h-20 w-20 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-3xl mb-3 animate-pulse">
                    🎙️
                  </div>
                  <div className="font-bold text-lg">{activeCall.peerName}</div>
                  <div className="text-xs text-slate-400 mt-1">{activeCall.peerSubtitle}</div>
                  <div className="text-[11px] text-emerald-400 mt-2 font-mono">
                    Opus WebRTC Audio Track Active (Echo Cancellation On)
                  </div>
                </div>
              )}
            </div>

            {/* Metering Info for Celebrity Calls */}
            {activeCall.rateCoinsPerMin > 0 && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
                <span className="text-amber-200">
                  Rate: <strong>{activeCall.rateCoinsPerMin} Coins/min</strong>
                </span>
                <span className="text-amber-300 font-bold">
                  Charged: {activeCall.coinsCharged} Coins • Balance: {currentUser.coinBalance}
                </span>
              </div>
            )}

            {/* WebRTC Call Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <button
                onClick={() => {
                  const nextMuted = !activeCall.muted;
                  webrtcClientRef.current?.toggleAudioMute(nextMuted);
                  setActiveCall((prev) => (prev ? { ...prev, muted: nextMuted } : null));
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold border ${
                  activeCall.muted
                    ? 'bg-amber-600 border-amber-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-200'
                }`}
              >
                {activeCall.muted ? '🔇 Unmute Mic' : '🎙️ Mute Mic'}
              </button>

              {activeCall.videoPermitted ? (
                <button
                  onClick={() => {
                    const nextVideo = !activeCall.videoEnabled;
                    webrtcClientRef.current?.toggleVideoTrack(nextVideo);
                    setActiveCall((prev) => (prev ? { ...prev, videoEnabled: nextVideo } : null));
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold"
                >
                  {activeCall.videoEnabled ? '📷 Turn Camera Off' : '📹 Switch Camera On'}
                </button>
              ) : (
                <span className="text-[11px] text-slate-500 px-2">
                  🔒 WebRTC Video Disabled on Support Calls
                </span>
              )}

              <button
                onClick={() => {
                  webrtcClientRef.current?.stopCall();
                  setActiveCall(null);
                  notify('Peer reported & blocked. Session logged for Super Admin.');
                }}
                className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950 text-rose-300 border border-slate-700 text-xs font-semibold"
              >
                🚩 Report & Block
              </button>

              <button
                onClick={() => {
                  webrtcClientRef.current?.stopCall();
                  setActiveCall(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                End Call
              </button>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
