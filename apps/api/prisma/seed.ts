/**
 * Development seed: the demo accounts and sample data.
 * Idempotent: safe to run repeatedly (users are matched by phone number; their related data is replaced).
 * Run with: npm run db:seed
 */
import { Gender, PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000);
const daysFromNow = (d: number, plusHours = 0) =>
  new Date(Date.now() + d * 86_400_000 + plusHours * 3_600_000);

async function upsertUser(phoneNumber: string, displayName: string, role: UserRole, coins = 0) {
  const user = await prisma.user.upsert({
    where: { phoneNumber },
    update: { displayName, role },
    create: { phoneNumber, displayName, role },
  });
  await prisma.wallet.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id, coinBalance: coins },
  });
  return user;
}

async function main() {
  // --- Accounts (same phone numbers as the old demo) -------------------------
  const arjun = await upsertUser('+919876543210', 'Arjun Nair', 'NORMAL', 650);
  await upsertUser('+919876543211', 'Meera Krishnan', 'NORMAL', 180);
  const dulquer = await upsertUser('+919999900001', 'Dulquer Sithara', 'CELEBRITY');
  const ananya = await upsertUser('+919999900002', 'Ananya Menon', 'CELEBRITY');
  const org = await upsertUser('+919888800001', 'Kochi Live Arena', 'ORG');
  const rahul = await upsertUser('+919777700001', 'Rahul — Customer Care', 'SUPPORT');
  await upsertUser('+919000000001', 'Platform Control', 'SUPER_ADMIN');

  // --- Celebrity profiles + media -------------------------------------------
  const celebs = [
    {
      user: dulquer,
      category: 'Cinema & Acting',
      bio: 'Malayalam & Pan-Indian cinema actor. Available for fan audio & video calls every evening.',
      audio: 60,
      video: 150,
      followers: 128_400,
      media: [
        {
          mediaType: 'PHOTO' as const,
          mediaUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800',
          caption: 'Behind the scenes from our new movie shoot in Fort Kochi!',
          likesCount: 4320,
          createdAt: hoursAgo(5),
        },
        {
          mediaType: 'VIDEO' as const,
          mediaUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
          caption: 'Quick teaser before tonight’s live fan video calls!',
          likesCount: 8910,
          createdAt: hoursAgo(2),
        },
      ],
    },
    {
      user: ananya,
      category: 'Playback Singer & Indie Pop',
      bio: 'Award-winning vocalist & composer. Join me for live jam sessions over audio or video.',
      audio: 40,
      video: 100,
      followers: 84_500,
      media: [
        {
          mediaType: 'PHOTO' as const,
          mediaUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
          caption: 'Acoustic rehearsal night in Trivandrum!',
          likesCount: 2150,
          createdAt: hoursAgo(12),
        },
      ],
    },
  ];
  for (const c of celebs) {
    const profile = {
      category: c.category,
      bio: c.bio,
      isVerified: true,
      audioRateCoinsPerMin: c.audio,
      videoRateCoinsPerMin: c.video,
      followersCount: c.followers,
    };
    await prisma.celebrityProfile.upsert({
      where: { userId: c.user.id },
      update: profile,
      create: { userId: c.user.id, ...profile },
    });
    await prisma.celebrityMedia.deleteMany({ where: { celebrityId: c.user.id } });
    await prisma.celebrityMedia.createMany({
      data: c.media.map((m) => ({ ...m, celebrityId: c.user.id })),
    });
  }

  // --- Organization + events ---------------------------------------------------
  await prisma.organizationProfile.upsert({
    where: { userId: org.id },
    update: {},
    create: {
      userId: org.id,
      companyName: 'Kochi Live Arena Events Pvt Ltd',
      registrationNo: 'DEV-GST-0001',
      isVerified: true,
    },
  });
  await prisma.event.deleteMany({ where: { orgId: org.id, bookings: { none: {} } } });
  await prisma.event.create({
    data: {
      orgId: org.id,
      title: 'Kochi Sunset Music & Indie Fest',
      description: 'Open-air concert featuring top South Indian bands, food stalls and fan meetups.',
      venueName: 'Bolgatty Palace Grounds',
      city: 'Kochi',
      latitude: 9.9816,
      longitude: 76.2673,
      startTime: daysFromNow(4),
      endTime: daysFromNow(4, 5),
      ticketTiers: {
        create: [
          { name: 'General Access', priceFiat: 499, totalCapacity: 500 },
          { name: 'VIP Fan Pit', priceFiat: 1499, totalCapacity: 100 },
        ],
      },
    },
  });
  await prisma.event.create({
    data: {
      orgId: org.id,
      title: 'Malabar Tech & Creators Summit',
      description: 'Meet digital creators, startups and celebrities at Calicut Trade Centre.',
      venueName: 'Calicut Trade Centre',
      city: 'Kozhikode',
      latitude: 11.2588,
      longitude: 75.7804,
      startTime: daysFromNow(9),
      endTime: daysFromNow(9, 6),
      ticketTiers: {
        create: [
          { name: 'Standard Pass', priceFiat: 299, totalCapacity: 300 },
          { name: 'Creator Lounge Pass', priceFiat: 999, totalCapacity: 50 },
        ],
      },
    },
  });

  // --- One open support ticket --------------------------------------------------
  await prisma.supportTicket.deleteMany({ where: { requesterId: arjun.id } });
  await prisma.supportTicket.create({
    data: {
      requesterId: arjun.id,
      assignedAgentId: rahul.id,
      subject: 'Coins not credited after recharge',
      messages: {
        create: [{ senderId: arjun.id, content: 'I recharged 300 coins but my balance did not update.' }],
      },
    },
  });

  // --- Pending role applications (to test admin approval) -------------------------
  // These users stay NORMAL until an admin approves them.
  const pendingApplicants = [
    {
      phone: '+919999900003',
      name: 'Nivin Rajan',
      requestedRole: 'CELEBRITY' as const,
      details: {
        category: 'Stand-up Comedy',
        bio: 'Malayalam stand-up comedian with 200k followers. Wants to host fan calls.',
        socialUrl: 'https://instagram.com/example',
      },
    },
    {
      phone: '+919888800002',
      name: 'Malabar Events Co',
      requestedRole: 'ORG' as const,
      details: {
        companyName: 'Malabar Events Co LLP',
        registrationNo: 'DEV-GST-0002',
        websiteUrl: 'https://example.com',
      },
    },
  ];
  for (const a of pendingApplicants) {
    const user = await upsertUser(a.phone, a.name, 'NORMAL', 100);
    await prisma.roleApplication.deleteMany({ where: { userId: user.id } });
    await prisma.celebrityProfile.deleteMany({ where: { userId: user.id } });
    await prisma.organizationProfile.deleteMany({ where: { userId: user.id } });
    await prisma.roleApplication.create({
      data: { userId: user.id, requestedRole: a.requestedRole, details: a.details },
    });
  }

  // --- Profile details (city, date of birth, interests) ---------------------------
  const profiles: Record<
    string,
    { city: string; dob: string; gender?: Gender; interests: string[]; bio?: string }
  > = {
    '+919876543210': {
      city: 'Kochi',
      dob: '1998-04-12',
      gender: 'MAN',
      interests: ['Cricket', 'Films', 'Food'],
      bio: 'Weekend cricketer, weekday coder.',
    },
    '+919876543211': {
      city: 'Thiruvananthapuram',
      dob: '2000-09-03',
      gender: 'WOMAN',
      interests: ['Music', 'Books', 'Travel'],
    },
    '+919999900001': {
      city: 'Kochi',
      dob: '1990-07-28',
      gender: 'MAN',
      interests: ['Films', 'Travel'],
      bio: 'Actor. Fan calls most evenings.',
    },
    '+919999900002': {
      city: 'Thiruvananthapuram',
      dob: '1995-01-19',
      gender: 'WOMAN',
      interests: ['Music', 'Dance'],
      bio: 'Playback singer & composer.',
    },
    '+919888800001': { city: 'Kochi', dob: '1985-11-02', interests: ['Music', 'Startups'] },
    '+919777700001': { city: 'Kozhikode', dob: '1996-06-15', gender: 'MAN', interests: ['Tech'] },
    '+919000000001': { city: 'Kochi', dob: '1988-03-30', interests: ['Tech', 'Startups'] },
    '+919999900003': {
      city: 'Thrissur',
      dob: '1997-12-08',
      gender: 'MAN',
      interests: ['Comedy', 'Films'],
      bio: 'Stand-up comic.',
    },
    '+919888800002': { city: 'Kozhikode', dob: '1983-05-21', interests: ['Music', 'Food'] },
  };
  for (const [phoneNumber, p] of Object.entries(profiles)) {
    await prisma.user.update({
      where: { phoneNumber },
      data: {
        city: p.city,
        dateOfBirth: new Date(`${p.dob}T00:00:00Z`),
        gender: p.gender ?? null,
        interests: p.interests,
        bio: p.bio ?? null,
      },
    });
  }

  const counts = {
    users: await prisma.user.count(),
    celebrities: await prisma.celebrityProfile.count(),
    events: await prisma.event.count(),
    supportTickets: await prisma.supportTicket.count(),
    pendingApplications: await prisma.roleApplication.count({ where: { status: 'PENDING' } }),
  };
  console.log('Seed complete:', counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
