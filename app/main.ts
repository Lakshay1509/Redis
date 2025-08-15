import * as net from "net";
import { parseRESPCommand, formatRESPError } from './resp-parser';
import { handlePing, handleEcho, handleSet, handleGet, handleRPUSH, handleLRANGE, handleLPUSH, handleLLEN, handleLPOP, handleBLPOP, handleGetType } from './commands';
import { arrStore } from './store';
import { handleXADD, handleXRANGE, handleXREAD } from "./stream/commands";

const server: net.Server = net.createServer((connection: net.Socket) => {
  connection.on("data", (data: Buffer) => {
    const input = data.toString();

    // Parse RESP command
    const command = parseRESPCommand(input);
    if (!command) return;

    const cmd = command[0].toUpperCase();

    switch (cmd) {
      case "PING":
        handlePing(connection, command);
        break;

      case "ECHO":
        handleEcho(connection, command);
        break;

      case "SET":
        handleSet(connection, command);
        break;

      case "GET":
        handleGet(connection, command);
        break;
      
        case "TYPE":
          handleGetType(connection,command);
          break;
        
        case "RPUSH":
            handleRPUSH(connection,command);
            break;
        case "LRANGE":
          handleLRANGE(connection,command);
          break;
        case "LPUSH":
          handleLPUSH(connection,command);
          break
        case "LLEN":
          handleLLEN(connection,command);
          break
        case "LPOP":
          handleLPOP(connection,command);
          break
        case "BLPOP":
          handleBLPOP(connection,command);
          break;
        case "XADD":
          handleXADD(connection,command);
          break;
        case "XRANGE":
          handleXRANGE(connection,command);
          break;
        case "XREAD":
          handleXREAD(connection,command);
          break;


      default:
        connection.write(formatRESPError("unknown command"));
    }
  });

  // Clean up when client disconnects
  connection.on('close', () => {
    arrStore.cleanupDisconnectedClients();
  });

  connection.on('error', () => {
    arrStore.cleanupDisconnectedClients();
  });
});

server.listen(6379, () => {
  console.log("Redis server listening on port 6379");
});
