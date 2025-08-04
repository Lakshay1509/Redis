import type { StoredValue } from './types';

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

  set(key: string, value: string): number {
    if (!(key in this.arrStore)) {
      this.arrStore[key] = [];  
    }
    this.arrStore[key].push(value); 
    return this.arrStore[key].length;
  }

  getLen(key:string):number{

    if (!(key in this.arrStore)) {
      return 0;  
    }
    return this.arrStore[key].length;
  }
}


export const store = new RedisStore();
export const arrStore = new RedisStoreArr();