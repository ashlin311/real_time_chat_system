import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';

export type MessageCallback = (message: any) => void;

class StompClientService {
  private client: Client | null = null;
  private subscriptions: Map<String, StompSubscription> = new Map();
  private connectionAttempts = 0;
  private readonly MAX_RECONNECT_DELAY = 30000;
  private readonly BASE_RECONNECT_DELAY = 2000;
  
  public connect(token: string, onConnect: () => void, onError: (err: any) => void) {
    if (this.client && this.client.active) {
      console.warn("STOMP Client already connected or connecting.");
      return;
    }

    this.connectionAttempts = 0;

    this.client = new Client({
      brokerURL: 'ws://localhost:8080/ws',
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: function (str) {
        console.log('STOMP: ' + str);
      },
      reconnectDelay: this.BASE_RECONNECT_DELAY,
      heartbeatIncoming: 15000,
      heartbeatOutgoing: 15000,
      connectionTimeout: 10000,
    });

    this.client.onConnect = (frame) => {
      console.log('STOMP Connected: ' + frame);
      this.connectionAttempts = 0;
      onConnect();
    };

    this.client.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
      onError(frame.headers['message']);
    };
    
    this.client.onWebSocketError = (event) => {
        console.error("WebSocket Error: ", event);
        this.handleReconnectBackoff();
        onError(event);
    }
    
    this.client.onWebSocketClose = (event) => {
        console.log("WebSocket connection closed", event);
        this.handleReconnectBackoff();
    }

    this.client.activate();
  }

  private handleReconnectBackoff() {
    if (!this.client) return;
    this.connectionAttempts++;
    const delay = Math.min(this.BASE_RECONNECT_DELAY * Math.pow(2, this.connectionAttempts), this.MAX_RECONNECT_DELAY);
    console.log(`STOMP: Reconnecting in ${delay}ms (Attempt ${this.connectionAttempts})`);
    this.client.reconnectDelay = delay;
  }

  public disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
    this.subscriptions.clear();
  }

  public subscribeToRoom(roomId: string, callback: MessageCallback) {
    if (!this.client || !this.client.connected) {
      console.error("Cannot subscribe, STOMP client is not connected.");
      return;
    }

    if (this.subscriptions.has(roomId)) {
      return; // Already subscribed
    }

    const topic = `/topic/chat/${roomId}`;
    const sub = this.client.subscribe(topic, (message: IMessage) => {
      if (message.body) {
        try {
          const body = JSON.parse(message.body);
          callback(body);
        } catch (err) {
          console.error("Failed to parse message body: ", err);
        }
      }
    });
    
    this.subscriptions.set(roomId, sub);
    console.log(`Subscribed to ${topic}`);
  }

  public sendMessage(token: string, roomId: string, content: string, contentType: string = "TEXT", fileName?: string, senderName?: string) {
    if (!this.client || !this.client.connected) {
      console.error("Cannot send message, STOMP client is not connected.");
      return;
    }

    const destination = `/app/chat/${roomId}/send`;
    const payload = {
      roomId: roomId,
      content: content,
      contentType: contentType,
      fileName: fileName,
      senderName: senderName || 'Anonymous'
    };

    this.client.publish({
      destination: destination,
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
  }
}

export const stompClient = new StompClientService();
