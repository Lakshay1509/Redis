interface StreamEntry {
  [field: string]: string | number;
}

class RedisStream {
  private store = new Map<string, Map<string, StreamEntry>>();

  validate(streamKey: string, streamId: string): {isValid: boolean, type: number,streamId:string} {
    const stream = this.store.get(streamKey);
    let lastId: string | undefined;
    
    if (stream) {
      for (const [key] of stream) {
        lastId = key;
      }
    }

    const [leftPart, rightPart] = streamId.split("-");

    if(Number(leftPart) >= 0 && rightPart==="*"){
      if(lastId===undefined){
        if(Number(leftPart)===0){
            return {isValid:true,type:1,streamId:`0-1`}
          }
          else{
            return {isValid:true,type:1,streamId:`${leftPart}-0`}
          }
      }
      else{
        const [leftLastId, rightLastId] = lastId.split("-");
        if(Number(leftLastId)===Number(leftPart)){
          return {isValid:true,type:1,streamId:`${leftPart}-${Number(rightLastId)+1}`}
        }
        else{
          if(Number(leftPart)===0){
            return {isValid:true,type:1,streamId:`0-1`}
          }
          else{
            return {isValid:true,type:1,streamId:`${leftPart}-0`}
          }
        }
        
      }
      
    }
    
    // Basic format validation
    if (Number(leftPart) < 0 || Number(rightPart) <= 0) {
      return {isValid: false, type: 0,streamId:streamId};
    }

    // If no previous entries, current ID is valid
    if (lastId === undefined) {
      return {isValid: true, type: 0,streamId:streamId};
    }

    // Compare with last ID
    const [leftLastId, rightLastId] = lastId.split("-");
    const currentTimestamp = Number(leftPart);
    const currentSequence = Number(rightPart);
    const lastTimestamp = Number(leftLastId);
    const lastSequence = Number(rightLastId);

    if (currentTimestamp === lastTimestamp) {
      // Same timestamp: sequence must be greater
      return {isValid: currentSequence > lastSequence, type: 1,streamId:streamId};
    } else {
      // Different timestamp: timestamp must be greater
      return {isValid: currentTimestamp > lastTimestamp, type: 1,streamId:streamId};
    }
}


  add(
    streamKey: string,
    streamId: string,
    fields: Record<string, string | number>
  ): void {
    let stream = this.store.get(streamKey);
    if (!stream) {
      stream = new Map<string, StreamEntry>();
      this.store.set(streamKey, stream);
    }

    const existingEntry = stream.get(streamId) || {};
    const mergedFields = { ...existingEntry, ...fields };
    stream.set(streamId, mergedFields);
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
  getRange(
    streamKey: string,
    startId?: string,
    endId?: string
  ): Array<{ id: string; entry: StreamEntry }> {
    const stream = this.store.get(streamKey);
    if (!stream) return [];

    const entries: Array<{ id: string; entry: StreamEntry }> = [];

    for (const [id, entry] of stream) {
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
