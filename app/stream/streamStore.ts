interface StreamEntry {
  [field: string|number]: string | number;
}

class RedisStream {
  // Map structure: stream_key -> stream_id -> field-value pairs
  private store = new Map<string, Map<string, StreamEntry>>();

  
  add(streamKey: string, streamId: string, fields: Record<string, string | number>): void {
   
    let stream = this.store.get(streamKey);
    if (!stream) {
      stream = new Map<string, StreamEntry>();
      this.store.set(streamKey, stream);
    }

    
    stream.set(streamId, fields);
  }

  // Get specific entry by stream key and ID
  get(streamKey: string, streamId: string): StreamEntry | undefined {
    const stream = this.store.get(streamKey);
    return stream?.get(streamId);
  }

  // Get all entries for a stream key
  getAll(streamKey: string): Map<string, StreamEntry> | undefined {
    return this.store.get(streamKey);
  }

  // Get entries in a range (useful for Redis-like range queries)
  getRange(streamKey: string, startId?: string, endId?: string): Array<{id: string, entry: StreamEntry}> {
    const stream = this.store.get(streamKey);
    if (!stream) return [];

    const entries: Array<{id: string, entry: StreamEntry}> = [];
    
    for (const [id, entry] of stream) {
      // Simple string comparison for IDs (Redis uses more sophisticated comparison)
      if ((!startId || id >= startId) && (!endId || id <= endId)) {
        entries.push({ id, entry });
      }
    }

    return entries.sort((a, b) => a.id.localeCompare(b.id));
  }

  // Check if stream exists
  hasStream(streamKey: string): boolean {
    return this.store.has(streamKey);
  }

  // Get stream length
  length(streamKey: string): number {
    const stream = this.store.get(streamKey);
    return stream ? stream.size : 0;
  }
}

export const RedisStreamStore = new RedisStream();