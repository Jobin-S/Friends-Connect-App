import { Body, Controller, Get, Param, Post, Query, BadRequestException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { StoreService, EventData } from '../common/store.service';

@Controller('api/events')
export class EventsController {
  private bookings: Array<{
    bookingId: string;
    userId: string;
    eventId: string;
    eventTitle: string;
    tierId: string;
    tierName: string;
    quantity: number;
    totalPaid: number;
    qrCodeHash: string;
    status: 'CONFIRMED' | 'CHECKED_IN';
    bookedAt: string;
  }> = [];

  constructor(private readonly store: StoreService) {}

  @Get()
  listEvents(
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('radiusKm') radiusKm?: string,
    @Query('city') city?: string,
  ) {
    const allEvents = Array.from(this.store.events.values()).filter((e) => e.status === 'PUBLISHED');

    const userLat = lat ? parseFloat(lat) : undefined;
    const userLng = lng ? parseFloat(lng) : undefined;
    const maxRadiusKm = radiusKm ? parseFloat(radiusKm) : undefined;

    const enriched = allEvents.map((event) => {
      const distanceKm =
        userLat !== undefined && userLng !== undefined
          ? this.calculateDistanceKm(userLat, userLng, event.latitude, event.longitude)
          : null;
      return {
        ...event,
        distanceKm: distanceKm !== null ? Number(distanceKm.toFixed(1)) : null,
      };
    });

    let filtered = enriched;
    if (city) {
      filtered = filtered.filter((e) => e.city.toLowerCase().includes(city.toLowerCase()));
    }
    if (maxRadiusKm !== undefined && userLat !== undefined && userLng !== undefined) {
      filtered = filtered.filter((e) => e.distanceKm !== null && e.distanceKm <= maxRadiusKm);
    }

    return filtered.sort((a, b) => {
      if (a.distanceKm !== null && b.distanceKm !== null) {
        return a.distanceKm - b.distanceKm;
      }
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });
  }

  @Post()
  createEvent(
    @Body()
    body: {
      orgId: string;
      title: string;
      description: string;
      venueName: string;
      city: string;
      latitude: number;
      longitude: number;
      startTime: string;
      endTime: string;
      ticketTiers: Array<{ name: string; priceFiat: number; totalCapacity: number }>;
    },
  ) {
    const orgUser = this.store.users.get(body.orgId);
    const id = `evt-${Date.now()}`;

    const newEvent: EventData = {
      id,
      orgId: body.orgId,
      orgName: orgUser?.displayName || 'Verified Organization',
      title: body.title,
      description: body.description,
      venueName: body.venueName,
      city: body.city,
      latitude: Number(body.latitude) || 9.9816,
      longitude: Number(body.longitude) || 76.2673,
      startTime: body.startTime || new Date(Date.now() + 86400_000 * 7).toISOString(),
      endTime: body.endTime || new Date(Date.now() + 86400_000 * 7 + 14400_000).toISOString(),
      status: 'PUBLISHED',
      ticketTiers: (body.ticketTiers || []).map((t, idx) => ({
        id: `tier-${Date.now()}-${idx}`,
        name: t.name,
        priceFiat: Number(t.priceFiat),
        totalCapacity: Number(t.totalCapacity),
        soldCount: 0,
      })),
    };

    this.store.events.set(id, newEvent);
    return newEvent;
  }

  @Post(':eventId/book')
  bookTickets(
    @Param('eventId') eventId: string,
    @Body() body: { userId: string; tierId: string; quantity: number },
  ) {
    const event = this.store.events.get(eventId);
    if (!event) {
      throw new BadRequestException('Event not found');
    }

    const tier = event.ticketTiers.find((t) => t.id === body.tierId);
    if (!tier) {
      throw new BadRequestException('Ticket tier not found');
    }

    const qty = Math.max(1, Number(body.quantity || 1));
    if (tier.soldCount + qty > tier.totalCapacity) {
      throw new BadRequestException('Not enough tickets remaining in this tier');
    }

    tier.soldCount += qty;
    const bookingId = `bkg-${Date.now()}`;
    const qrCodeHash = createHmac('sha256', 'friends-connect-ticket-secret')
      .update(`${bookingId}:${body.userId}:${eventId}:${body.tierId}`)
      .digest('hex')
      .slice(0, 20)
      .toUpperCase();

    const booking = {
      bookingId,
      userId: body.userId,
      eventId,
      eventTitle: event.title,
      tierId: tier.id,
      tierName: tier.name,
      quantity: qty,
      totalPaid: tier.priceFiat * qty,
      qrCodeHash: `FC-QR-${qrCodeHash}`,
      status: 'CONFIRMED' as const,
      bookedAt: new Date().toISOString(),
    };

    this.bookings.unshift(booking);
    return booking;
  }

  @Get('bookings/:userId')
  getUserBookings(@Param('userId') userId: string) {
    return this.bookings.filter((b) => b.userId === userId);
  }

  @Post('verify-qr')
  verifyTicketQr(@Body() body: { qrCodeHash: string }) {
    const booking = this.bookings.find((b) => b.qrCodeHash === body.qrCodeHash);
    if (!booking) {
      throw new BadRequestException('Invalid QR Ticket Code');
    }
    booking.status = 'CHECKED_IN';
    return {
      valid: true,
      booking,
    };
  }

  private calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
