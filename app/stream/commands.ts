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
  else{
    for(let i = 3; i<command.length;i+=2){
    const fieldKey = command[i];
    const fieldValue = command[i+1];
    RedisStreamStore.add(key,streamId,{fieldKey,fieldValue});
  }

  connection.write(formatRESPBulkString(streamId));

  }

  
}