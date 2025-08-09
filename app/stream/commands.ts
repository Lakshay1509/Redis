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
  const Id = command[2];
  for(let i = 3; i<command.length;i+=2){
    const fieldKey = command[i];
    const fieldValue = command[i+1];
    RedisStreamStore.add(key,Id,{fieldKey,fieldValue});
  }

  connection.write(formatRESPBulkString(Id));
}