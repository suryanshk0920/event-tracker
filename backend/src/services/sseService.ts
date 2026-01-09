import { Response } from 'express';

interface SSEClient {
  id: string;
  response: Response;
  eventId: number;
}

class SSEService {
  private clients: Map<number, SSEClient[]> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start heartbeat to keep connections alive
    this.startHeartbeat();
  }

  /**
   * Add a new SSE client for an event
   */
  addClient(eventId: number, response: Response, clientId: string): void {
    const client: SSEClient = { id: clientId, response, eventId };

    if (!this.clients.has(eventId)) {
      this.clients.set(eventId, []);
    }

    this.clients.get(eventId)!.push(client);
    console.log(`SSE client ${clientId} connected to event ${eventId}. Total clients: ${this.clients.get(eventId)!.length}`);

    // Send initial connection confirmation
    this.sendToClient(client, {
      type: 'connected',
      message: 'Connected to attendance stream',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Remove a client when they disconnect
   */
  removeClient(eventId: number, clientId: string): void {
    const eventClients = this.clients.get(eventId);
    if (eventClients) {
      const updatedClients = eventClients.filter(client => client.id !== clientId);
      
      if (updatedClients.length === 0) {
        this.clients.delete(eventId);
      } else {
        this.clients.set(eventId, updatedClients);
      }
      
      console.log(`SSE client ${clientId} disconnected from event ${eventId}. Remaining clients: ${updatedClients.length}`);
    }
  }

  /**
   * Broadcast an event to all clients subscribed to a specific event
   */
  broadcast(eventId: number, data: any): void {
    const eventClients = this.clients.get(eventId);
    
    if (!eventClients || eventClients.length === 0) {
      console.log(`No SSE clients connected to event ${eventId}`);
      return;
    }

    console.log(`Broadcasting to ${eventClients.length} clients for event ${eventId}`);
    
    eventClients.forEach(client => {
      this.sendToClient(client, data);
    });
  }

  /**
   * Send data to a specific client
   */
  private sendToClient(client: SSEClient, data: any): void {
    try {
      const payload = {
        ...data,
        timestamp: data.timestamp || new Date().toISOString()
      };

      client.response.write(`data: ${JSON.stringify(payload)}\n\n`);
    } catch (error) {
      console.error(`Error sending to client ${client.id}:`, error);
      this.removeClient(client.eventId, client.id);
    }
  }

  /**
   * Send heartbeat to all connected clients to keep connections alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((eventClients, eventId) => {
        eventClients.forEach(client => {
          try {
            client.response.write(`: heartbeat\n\n`);
          } catch (error) {
            console.error(`Heartbeat failed for client ${client.id}:`, error);
            this.removeClient(eventId, client.id);
          }
        });
      });
    }, 30000); // Every 30 seconds
  }

  /**
   * Get the number of connected clients for an event
   */
  getClientCount(eventId: number): number {
    return this.clients.get(eventId)?.length || 0;
  }

  /**
   * Get total number of connected clients across all events
   */
  getTotalClientCount(): number {
    let total = 0;
    this.clients.forEach(eventClients => {
      total += eventClients.length;
    });
    return total;
  }

  /**
   * Clean up on shutdown
   */
  shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.clients.forEach((eventClients, eventId) => {
      eventClients.forEach(client => {
        try {
          client.response.end();
        } catch (error) {
          console.error(`Error closing client connection:`, error);
        }
      });
    });
    
    this.clients.clear();
    console.log('SSE service shut down');
  }
}

// Export singleton instance
export const sseService = new SSEService();

// Clean up on process exit
process.on('SIGTERM', () => {
  sseService.shutdown();
});

process.on('SIGINT', () => {
  sseService.shutdown();
});
