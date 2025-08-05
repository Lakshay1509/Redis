import * as net from "net";
import { parseRESPCommand, formatRESPError } from './resp-parser';
import { handlePing, handleEcho, handleSet, handleGet, handleRPUSH, handleLRANGE } from './commands';

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
        
        case "RPUSH":
            handleRPUSH(connection,command);
            break;
        case "LRANGE":
          handleLRANGE(connection,command);
          break;

      default:
        connection.write(formatRESPError("unknown command"));
    }
  });
});

server.listen(6379, () => {
  console.log("Redis server listening on port 6379");
});
