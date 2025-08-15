import * as net from "net";
import type { RESPCommand } from "../types"; 
import { RedisStreamStore } from "./streamStore";
import { formatRESPBulkString, formatRESPError, formatRESPString } from "../resp-parser";

export function handleXADD(connection: net.Socket, command: RESPCommand): void {
  if (command.length < 2) {
    connection.write(
      formatRESPError("wrong number of arguments for 'XADD' command")
    );
    return;
  }

  const key = command[1];
  let Id = command[2];

  const {isValid,type,streamId} = RedisStreamStore.validate(key,Id);
  if(isValid===false){
      if(type===0){
        connection.write(formatRESPError("The ID specified in XADD must be greater than 0-0"));
      }
      else{
        connection.write(formatRESPError("The ID specified in XADD is equal or smaller than the target stream top item"));
      }
      return; 
  }
  else {
    
    const fields: Record<string, string> = {};
    
    for(let i = 3; i < command.length; i += 2) {
      const fieldName = command[i];
      const fieldValue = command[i+1];
     
      fields[fieldName] = fieldValue;
    }
    
    
    RedisStreamStore.add(key, streamId, fields);
    
    connection.write(formatRESPBulkString(streamId));
  }
}

export function handleXRANGE(connection: net.Socket, command: RESPCommand): void {
  if (command.length < 4) {
    connection.write(
      formatRESPError("wrong number of arguments for 'XRANGE' command")
    );
    return;
  }

  const key = command[1];
  const start = command[2];
  const end = command[3];
  
  const entries = RedisStreamStore.getRange(key, start, end);
  
  let response = "*" + entries.length + "\r\n";
  
  for (const { id, entry } of entries) {
    response += "*2\r\n"; 
    response += formatRESPBulkString(id);
    
   
    const values = [];
    for (const [field, value] of Object.entries(entry)) {
      values.push(field);
      values.push(value);
    }
    
    response += "*" + values.length + "\r\n";
    
   
    for (const value of values) {
      response += formatRESPBulkString(String(value));
    }
  }
  
  connection.write(response);
}