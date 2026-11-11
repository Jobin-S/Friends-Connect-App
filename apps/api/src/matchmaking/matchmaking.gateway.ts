import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import type { SocketData } from '../auth/socket-auth.adapter';
import { StoreService } from '../common/store.service';
import { RtcTokenService } from '../calls/rtc-token.service';

interface QueueEntry {
  userId: string;
  socketId: string;
  displayName: string;
  mode: 'AUDIO' | 'VIDEO';
  joinedAt: number;
}

@WebSocketGateway()
export class MatchmakingGateway {
  @WebSocketServer()
  server!: Server;

  private audioQueue: QueueEntry[] = [];
  private videoQueue: QueueEntry[] = [];

  constructor(
    private readonly store: StoreService,
    private readonly rtcTokenService: RtcTokenService,
  ) {}

  @SubscribeMessage('join_random_queue')
  async handleJoinQueue(
    @MessageBody() payload: { mode: 'AUDIO' | 'VIDEO' },
    @ConnectedSocket() client: Socket,
  ) {
    // Identity comes from the authenticated socket, never from the message.
    const user = (client.data as SocketData).user;
    if (user.status !== 'ACTIVE') {
      return { error: `Account is ${user.status}. Cannot join matchmaking.` };
    }
    if (payload.mode === 'AUDIO' && !user.restrictions.canRandomAudio) {
      return { error: 'Random Audio Calls are restricted on your account by Super Admin.' };
    }
    if (payload.mode === 'VIDEO' && !user.restrictions.canRandomVideo) {
      return { error: 'Random Video Calls are restricted on your account by Super Admin.' };
    }

    const targetQueue = payload.mode === 'VIDEO' ? this.videoQueue : this.audioQueue;

    // Remove existing entry for same user if present
    const existingIdx = targetQueue.findIndex((q) => q.userId === user.id);
    if (existingIdx !== -1) {
      targetQueue.splice(existingIdx, 1);
    }

    // Find a compatible peer not blocked
    const peerIdx = targetQueue.findIndex(
      (candidate) => candidate.userId !== user.id && !this.isBlocked(user.id, candidate.userId),
    );

    if (peerIdx !== -1) {
      const peer = targetQueue.splice(peerIdx, 1)[0];
      const roomName = `random_${payload.mode.toLowerCase()}_${Date.now()}`;
      const callMode = payload.mode === 'VIDEO' ? 'RANDOM_VIDEO' : 'RANDOM_AUDIO';

      const callerToken = await this.rtcTokenService.createRoomToken({
        roomName,
        participantId: user.id,
        participantName: user.displayName,
        mode: callMode,
      });

      const peerToken = await this.rtcTokenService.createRoomToken({
        roomName,
        participantId: peer.userId,
        participantName: peer.displayName,
        mode: callMode,
      });

      client.emit('match_found', {
        roomName,
        mode: payload.mode,
        rtc: callerToken,
        peer: { userId: peer.userId, displayName: peer.displayName },
      });

      this.server.to(peer.socketId).emit('match_found', {
        roomName,
        mode: payload.mode,
        rtc: peerToken,
        peer: { userId: user.id, displayName: user.displayName },
      });

      return { status: 'MATCHED', roomName, mode: payload.mode };
    }

    targetQueue.push({
      userId: user.id,
      socketId: client.id,
      displayName: user.displayName,
      mode: payload.mode,
      joinedAt: Date.now(),
    });

    return {
      status: 'WAITING',
      mode: payload.mode,
      queuePosition: targetQueue.length,
    };
  }

  @SubscribeMessage('leave_random_queue')
  handleLeaveQueue(@ConnectedSocket() client: Socket) {
    const user = (client.data as SocketData).user;
    this.audioQueue = this.audioQueue.filter((q) => q.userId !== user.id);
    this.videoQueue = this.videoQueue.filter((q) => q.userId !== user.id);
    return { status: 'LEFT_QUEUE' };
  }

  @SubscribeMessage('report_and_block_peer')
  handleReportAndBlock(
    @MessageBody() body: { reportedId: string; reason: string },
    @ConnectedSocket() client: Socket,
  ) {
    const payload = { ...body, reporterId: (client.data as SocketData).user.id };
    const pairKey1 = `${payload.reporterId}:${payload.reportedId}`;
    const pairKey2 = `${payload.reportedId}:${payload.reporterId}`;
    this.store.blockedPairs.add(pairKey1);
    this.store.blockedPairs.add(pairKey2);
    return {
      success: true,
      message: 'Peer blocked permanently and session reported to Super Admin.',
    };
  }

  public getQueueSnapshot() {
    return {
      audioWaitingCount: this.audioQueue.length,
      videoWaitingCount: this.videoQueue.length,
    };
  }

  private isBlocked(userA: string, userB: string): boolean {
    return (
      this.store.blockedPairs.has(`${userA}:${userB}`) || this.store.blockedPairs.has(`${userB}:${userA}`)
    );
  }
}
