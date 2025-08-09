import type { StoredValue } from './types';
import * as net from "net";
import { formatRESPArray, formatRESPNull } from './resp-parser';

interface BlockingClient {
  connection: net.Socket;
  key: string;
  timeout: number;
  startTime: number;
}

class RedisStore {
  private store = new Map<string, StoredValue>();


  set(key: string, value: string, expiresAt?: number): void {
    this.store.set(key, { value, expiresAt });
  }

  get(key: string): string | null {
    const val = this.store.get(key);
    
    if (!val) {
      return null;
    }

    // Check if expired
    if (val.expiresAt && Date.now() > val.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return val.value;
  }

  getType(key:string):string|null {

  const value = this.get(key);

  if(!value){
    return null;
  }
  else{
    return typeof(value);
  }


}
  delete(key: string): boolean {
    return this.store.delete(key);
  }

  has(key: string): boolean {
    const val = this.store.get(key);
    if (!val) return false;
    
    // Check if expired
    if (val.expiresAt && Date.now() > val.expiresAt) {
      this.store.delete(key);
      return false;
    }
    
    return true;
  }

}

class RedisStoreArr {
  private arrStore: Record<string, any[]> = {};
  private blockingClients: BlockingClient[] = [];

  set(key: string, value: string): number {
    if (!(key in this.arrStore)) {
      this.arrStore[key] = [];  
    }
    this.arrStore[key].push(value); 
    
    return this.arrStore[key].length;
  }

  setReverse(key: string, value: string): number {
    if (!(key in this.arrStore)) {
      this.arrStore[key] = [];  
    }
    this.arrStore[key].unshift(value); 
    
    return this.arrStore[key].length;
  }

  getLen(key: string): number {
    if (!(key in this.arrStore)) {
      return 0;  
    }
    return this.arrStore[key].length;
  }

  getAt(key: string, index: number): string | undefined {
    if (!(key in this.arrStore)) {
      return undefined;
    }
    if (index < 0 || index >= this.arrStore[key].length) {
      return undefined;
    }
    return this.arrStore[key][index];
  }

  pop(key: string): string|null {
    if (!(key in this.arrStore)) {
      return null;  
    }
    if (this.arrStore[key].length === 0) {
      return null;
    }
    const popped = this.arrStore[key].shift();
    return popped || null;
  }

  addBlockingClient(connection: net.Socket, key: string, timeout: number): void {
    // First check if there's already an element available
    if (this.getLen(key) > 0) {
      const element = this.pop(key);
      if (element !== null) {
        connection.write(formatRESPArray([key, element]));
        return;
      }
    }

    // Add to blocking clients if no element is available
    this.blockingClients.push({
      connection,
      key,
      timeout,
      startTime: Date.now()
    });

    // Set up timeout if not infinite (0)
    if (timeout > 0) {
      setTimeout(() => {
        // Check if client is still waiting before sending timeout response
        const clientIndex = this.blockingClients.findIndex(
          client => client.connection === connection && client.key === key
        );
        
        if (clientIndex !== -1) {
          // Send null bulk string response for timeout
          connection.write(formatRESPNull());
          this.removeBlockingClient(connection, key);
        }
      }, timeout * 1000);
    }
  }

  // Public method to notify blocking clients after operations complete
  notifyWaitingClients(key: string): void {
    this.notifyBlockingClients(key);
  }

  private notifyBlockingClients(key: string): void {
    // Find all clients waiting for this key
    const waitingClients = this.blockingClients.filter(client => client.key === key);
    
    // Notify clients in FIFO order while there are elements
    for (const client of waitingClients) {
      if (this.getLen(key) > 0) {
        const element = this.pop(key);
        if (element !== null) {
          client.connection.write(formatRESPArray([key, element]));
          this.removeBlockingClient(client.connection, key);
        }
      } else {
        break; // No more elements available
      }
    }
  }

  private removeBlockingClient(connection: net.Socket, key: string): void {
    this.blockingClients = this.blockingClients.filter(
      client => !(client.connection === connection && client.key === key)
    );
  }

  // Clean up disconnected clients
  cleanupDisconnectedClients(): void {
    this.blockingClients = this.blockingClients.filter(client => 
      !client.connection.destroyed
    );
  }
}



export const store = new RedisStore();
export const arrStore = new RedisStoreArr();