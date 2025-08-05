import * as net from "net";
import type { RESPCommand } from './types';
import { store } from './store';
import { arrStore } from "./store";
import { formatRESPString, formatRESPError, formatRESPSimpleString, formatRESPNull ,formatRESPInt,formatRESPArray} from './resp-parser';

export function handlePing(connection: net.Socket, command: RESPCommand): void {
  connection.write(formatRESPSimpleString("PONG"));
}

export function handleEcho(connection: net.Socket, command: RESPCommand): void {
  if (command.length !== 2) {
    connection.write(formatRESPError("wrong number of arguments for 'echo' command"));
    return;
  }
  
  const message = command[1];
  connection.write(formatRESPString(message));
}

export function handleSet(connection: net.Socket, command: RESPCommand): void {
  if (command.length === 5) {
    const key = command[1];
    const value = command[2];
    const isPx = command[3];
    
    if (isPx.toUpperCase() !== "PX") {
      connection.write(formatRESPError("wrong arguments for 'set' command"));
      return;
    }
    
    const expiresAt = Date.now() + Number(command[4]);
    store.set(key, value, expiresAt);
    connection.write(formatRESPSimpleString("OK"));
  } else if (command.length === 3) {
    const key = command[1];
    const value = command[2];
    store.set(key, value);
    connection.write(formatRESPSimpleString("OK"));




  } else {
    connection.write(formatRESPError("wrong number of arguments for 'set' command"));
  }
}

export function handleGet(connection: net.Socket, command: RESPCommand): void {
  if (command.length !== 2) {
    connection.write(formatRESPError("wrong number of arguments for 'get' command"));
    return;
  }
  
  const key = command[1];
  const value = store.get(key);
  
  if (value === null) {
    connection.write(formatRESPNull());
  } else {
    connection.write(formatRESPString(value));
  }
}

export function handleRPUSH(connection: net.Socket, command: RESPCommand):void{

    if(command.length <3){

        connection.write(formatRESPError("wrong number of arguments for 'RPUSH'command "));
        return;
    }

    for(let i = 2;i<command.length;i++){
        arrStore.set(command[1],command[i]);
    }
    const length_arr = arrStore.getLen(command[1]);
    
    connection.write(formatRESPInt(length_arr))


}

export function handleLRANGE(connection: net.Socket, command: RESPCommand): void {
   
    if (command.length !== 4) {
        connection.write(formatRESPError("wrong number of arguments for 'LRANGE' command"));
        return;
    }

    const key = command[1];
    const startStr = command[2];
    const endStr = command[3];

    
    let startIndex = parseInt(startStr);
    let endIndex = parseInt(endStr);
    const listLength = arrStore.getLen(key);

    if(startIndex < 0){
        startIndex = listLength+startIndex;
        startIndex = Math.max(0,startIndex);

    }

    if(endIndex < 0){
      endIndex = listLength + endIndex;
      endIndex =  Math.max(0,endIndex);

    }
    
    

   
    if (isNaN(startIndex) || isNaN(endIndex)) {
        connection.write(formatRESPError("value is not an integer or out of range"));
        return;
    }

    
   

    
    if (listLength === 0) {
        connection.write(formatRESPArray([]));
        return;
    }

    
    if (startIndex >= listLength) {
        connection.write(formatRESPArray([]));
        return;
    }

    
    if (startIndex > endIndex) {
        connection.write(formatRESPArray([]));
        return;
    }

    
   
    const adjustedEndIndex = Math.min(endIndex, listLength - 1);

    
    const elements: string[] = [];
    for (let i = startIndex; i <= adjustedEndIndex; i++) {
        const element = arrStore.getAt(key, i);
        if (element !== undefined) {
            elements.push(element);
        }
    }

    
    connection.write(formatRESPArray(elements));
}




