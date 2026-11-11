import { Injectable } from '@nestjs/common';
import { AuthenticatedUser, UserRole } from './roles.guard';

export interface CelebrityData {
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
    createdAt: string;
  }>;
}

export interface EventData {
  id: string;
  orgId: string;
  orgName: string;
  title: string;
  description: string;
  venueName: string;
  city: string;
  latitude: number;
  longitude: number;
  startTime: string;
  endTime: string;
  status: 'PUBLISHED' | 'DRAFT' | 'CANCELLED';
  ticketTiers: Array<{
    id: string;
    name: string;
    priceFiat: number;
    totalCapacity: number;
    soldCount: number;
  }>;
}

export interface SupportTicketData {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterRole: UserRole;
  subject: string;
  priority: 'NORMAL' | 'CELEBRITY_VIP';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: string;
  messages: Array<{
    id: string;
    senderId: string;
    senderName: string;
    content: string;
    createdAt: string;
  }>;
}

@Injectable()
export class StoreService {
  public users: Map<
    string,
    AuthenticatedUser & { coinBalance: number; earnedCoins: number; isPremium: boolean }
  > = new Map();
  public celebrities: Map<string, CelebrityData> = new Map();
  public events: Map<string, EventData> = new Map();
  public supportTickets: Map<string, SupportTicketData> = new Map();
  public blockedPairs: Set<string> = new Set();

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // 1. Seed 5 Role Users
    this.users.set('usr-normal-1', {
      id: 'usr-normal-1',
      phoneNumber: '+919876543210',
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
    });

    this.users.set('usr-normal-2', {
      id: 'usr-normal-2',
      phoneNumber: '+919876543211',
      role: 'NORMAL',
      displayName: 'Meera Krishnan',
      status: 'ACTIVE',
      restrictions: {
        canRandomAudio: true,
        canRandomVideo: true,
        canCallCelebrities: true,
        maxCallsPerDay: 50,
      },
      coinBalance: 200,
      earnedCoins: 0,
      isPremium: false,
    });

    this.users.set('usr-celeb-1', {
      id: 'usr-celeb-1',
      phoneNumber: '+919999900001',
      role: 'CELEBRITY',
      displayName: 'Dulquer Sithara (Verified Star)',
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
    });

    this.users.set('usr-celeb-2', {
      id: 'usr-celeb-2',
      phoneNumber: '+919999900002',
      role: 'CELEBRITY',
      displayName: 'Ananya Menon (Music Artist)',
      status: 'ACTIVE',
      restrictions: {
        canRandomAudio: true,
        canRandomVideo: true,
        canCallCelebrities: true,
        maxCallsPerDay: 100,
      },
      coinBalance: 500,
      earnedCoins: 8900,
      isPremium: true,
    });

    this.users.set('usr-org-1', {
      id: 'usr-org-1',
      phoneNumber: '+919888800001',
      role: 'ORG',
      displayName: 'Kochi Live Arena Events Pvt Ltd',
      status: 'ACTIVE',
      restrictions: {
        canRandomAudio: false,
        canRandomVideo: false,
        canCallCelebrities: false,
        maxCallsPerDay: 0,
      },
      coinBalance: 0,
      earnedCoins: 0,
      isPremium: false,
    });

    this.users.set('usr-support-1', {
      id: 'usr-support-1',
      phoneNumber: '+919777700001',
      role: 'SUPPORT',
      displayName: 'Rahul (Customer Care Desk)',
      status: 'ACTIVE',
      restrictions: {
        canRandomAudio: false,
        canRandomVideo: false,
        canCallCelebrities: false,
        maxCallsPerDay: 500,
      },
      coinBalance: 0,
      earnedCoins: 0,
      isPremium: false,
    });

    this.users.set('usr-admin-1', {
      id: 'usr-admin-1',
      phoneNumber: '+919000000001',
      role: 'SUPER_ADMIN',
      displayName: 'Platform Super Admin',
      status: 'ACTIVE',
      restrictions: {
        canRandomAudio: true,
        canRandomVideo: true,
        canCallCelebrities: true,
        maxCallsPerDay: 9999,
      },
      coinBalance: 99999,
      earnedCoins: 0,
      isPremium: true,
    });

    // 2. Seed Celebrities
    this.celebrities.set('usr-celeb-1', {
      userId: 'usr-celeb-1',
      displayName: 'Dulquer Sithara',
      category: 'Cinema & Acting',
      bio: 'Malayalam & Pan-Indian Cinema Actor. Available for fan audio & video interactions every evening!',
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
          caption: 'Behind the scenes from our new movie shoot in Fort Kochi!',
          likesCount: 4320,
          createdAt: new Date(Date.now() - 3600_000 * 5).toISOString(),
        },
        {
          id: 'med-2',
          mediaType: 'VIDEO',
          mediaUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
          caption: 'Quick video teaser before tonight’s live fan video calls!',
          likesCount: 8910,
          createdAt: new Date(Date.now() - 3600_000 * 2).toISOString(),
        },
      ],
    });

    this.celebrities.set('usr-celeb-2', {
      userId: 'usr-celeb-2',
      displayName: 'Ananya Menon',
      category: 'Playback Singer & Indie Pop',
      bio: 'Award-winning vocalist & composer. Connect with me for live jam sessions via Audio or Video Call!',
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
          caption: 'Acoustic rehearsal night in Trivandrum!',
          likesCount: 2150,
          createdAt: new Date(Date.now() - 3600_000 * 12).toISOString(),
        },
      ],
    });

    // 3. Seed Location-Based Events (Kochi, Trivandrum, Calicut, Bangalore)
    this.events.set('evt-1', {
      id: 'evt-1',
      orgId: 'usr-org-1',
      orgName: 'Kochi Live Arena Events Pvt Ltd',
      title: 'Kochi Sunset Music & Indie Fest 2026',
      description: 'Live open-air concert featuring top South Indian bands, food stalls, and fan meetups.',
      venueName: 'Bolgatty Palace Grounds',
      city: 'Kochi',
      latitude: 9.9816,
      longitude: 76.2673,
      startTime: new Date(Date.now() + 86400_000 * 4).toISOString(),
      endTime: new Date(Date.now() + 86400_000 * 4 + 18000_000).toISOString(),
      status: 'PUBLISHED',
      ticketTiers: [
        { id: 'tier-1', name: 'General Access', priceFiat: 499, totalCapacity: 500, soldCount: 312 },
        { id: 'tier-2', name: 'VIP Fan Pit', priceFiat: 1499, totalCapacity: 100, soldCount: 74 },
      ],
    });

    this.events.set('evt-2', {
      id: 'evt-2',
      orgId: 'usr-org-1',
      orgName: 'Kochi Live Arena Events Pvt Ltd',
      title: 'Malabar Tech & Creators Summit',
      description: 'Meet digital creators, startups, and celebrities in Calicut Beach Arena.',
      venueName: 'Calicut Trade Centre',
      city: 'Kozhikode',
      latitude: 11.2588,
      longitude: 75.7804,
      startTime: new Date(Date.now() + 86400_000 * 9).toISOString(),
      endTime: new Date(Date.now() + 86400_000 * 9 + 21600_000).toISOString(),
      status: 'PUBLISHED',
      ticketTiers: [
        { id: 'tier-3', name: 'Standard Pass', priceFiat: 299, totalCapacity: 300, soldCount: 140 },
        { id: 'tier-4', name: 'Creator Lounge Pass', priceFiat: 999, totalCapacity: 50, soldCount: 29 },
      ],
    });

    // 4. Seed Customer Care Support Tickets (from both Normal Users and Celebrities)
    this.supportTickets.set('tkt-1', {
      id: 'tkt-1',
      requesterId: 'usr-celeb-1',
      requesterName: 'Dulquer Sithara',
      requesterRole: 'CELEBRITY',
      subject: 'Payout bank settlement verification for October earnings',
      priority: 'CELEBRITY_VIP',
      status: 'IN_PROGRESS',
      createdAt: new Date(Date.now() - 1800_000).toISOString(),
      messages: [
        {
          id: 'msg-1',
          senderId: 'usr-celeb-1',
          senderName: 'Dulquer Sithara',
          content:
            'Hi Support, I requested a withdrawal of 10,000 earned coins. Can we do a quick audio call or chat update?',
          createdAt: new Date(Date.now() - 1800_000).toISOString(),
        },
        {
          id: 'msg-2',
          senderId: 'usr-support-1',
          senderName: 'Rahul (Customer Care Desk)',
          content:
            'Hello! Yes, your VIP payout is approved. Feel free to start an Audio Support Call anytime if you need help.',
          createdAt: new Date(Date.now() - 1200_000).toISOString(),
        },
      ],
    });

    this.supportTickets.set('tkt-2', {
      id: 'tkt-2',
      requesterId: 'usr-normal-1',
      requesterName: 'Arjun Nair',
      requesterRole: 'NORMAL',
      subject: 'Event QR ticket download query',
      priority: 'NORMAL',
      status: 'OPEN',
      createdAt: new Date(Date.now() - 3600_000).toISOString(),
      messages: [
        {
          id: 'msg-3',
          senderId: 'usr-normal-1',
          senderName: 'Arjun Nair',
          content: 'I booked 2 VIP tickets for Kochi Sunset Fest. Where can I find the QR code?',
          createdAt: new Date(Date.now() - 3600_000).toISOString(),
        },
      ],
    });
  }
}
