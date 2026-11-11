import { Body, Controller, Get, Param, Patch, Post, BadRequestException } from '@nestjs/common';
import { StoreService } from '../common/store.service';

@Controller('api/support')
export class SupportController {
  constructor(private readonly store: StoreService) {}

  @Get('tickets')
  listTickets() {
    return Array.from(this.store.supportTickets.values());
  }

  @Post('tickets')
  createTicket(@Body() body: { requesterId: string; subject: string; initialMessage: string }) {
    const user = this.store.users.get(body.requesterId);
    if (!user) {
      throw new BadRequestException('Requester user not found');
    }

    const id = `tkt-${Date.now()}`;
    const ticket = {
      id,
      requesterId: user.id,
      requesterName: user.displayName,
      requesterRole: user.role,
      subject: body.subject,
      priority: user.role === 'CELEBRITY' ? ('CELEBRITY_VIP' as const) : ('NORMAL' as const),
      status: 'OPEN' as const,
      createdAt: new Date().toISOString(),
      messages: [
        {
          id: `msg-${Date.now()}`,
          senderId: user.id,
          senderName: user.displayName,
          content: body.initialMessage,
          createdAt: new Date().toISOString(),
        },
      ],
    };

    this.store.supportTickets.set(id, ticket);
    return ticket;
  }

  @Post('tickets/:id/messages')
  sendMessage(@Param('id') id: string, @Body() body: { senderId: string; content: string }) {
    const ticket = this.store.supportTickets.get(id);
    const sender = this.store.users.get(body.senderId);
    if (!ticket || !sender) {
      throw new BadRequestException('Ticket or Sender not found');
    }

    const msg = {
      id: `msg-${Date.now()}`,
      senderId: sender.id,
      senderName: sender.displayName,
      content: body.content,
      createdAt: new Date().toISOString(),
    };

    ticket.messages.push(msg);
    if (sender.role === 'SUPPORT' && ticket.status === 'OPEN') {
      ticket.status = 'IN_PROGRESS';
    }
    return ticket;
  }

  @Patch('tickets/:id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' }) {
    const ticket = this.store.supportTickets.get(id);
    if (!ticket) {
      throw new BadRequestException('Ticket not found');
    }
    ticket.status = body.status;
    return ticket;
  }
}
