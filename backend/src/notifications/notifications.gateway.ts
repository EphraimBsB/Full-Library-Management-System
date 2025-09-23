import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*', methods: ['GET', 'POST'] } })
export class NotificationsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(private readonly jwt: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = (client.handshake.auth?.token as string) || (client.handshake.query?.token as string);
      if (!token) {
        client.disconnect(true);
        return;
      }

      const payload: any = this.jwt.decode(token) || this.jwt.verify(token, { ignoreExpiration: false });
      const userId = payload?.sub || payload?.id || payload?.userId;
      if (!userId) {
        client.disconnect(true);
        return;
      }

      // Attach to socket and join a room by userId for targeted notifications
      (client.data as any).userId = userId;
      client.join(userId);
    } catch (e) {
      client.disconnect(true);
    }
  }

  emitToUser(userId: string, event: string, payload: any) {
    this.server.to(userId).emit(event, payload);
  }
}
