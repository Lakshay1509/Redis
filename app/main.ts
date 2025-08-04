import * as net from 'net';

// In-memory key-value store
const store = new Map<string, string>();

const server: net.Server = net.createServer((connection: net.Socket) => {
  connection.on("data", (data: Buffer) => {
    const input = data.toString();
    
    // Parse RESP command
    const command = parseRESPCommand(input);
    if (!command) return;
    
    const cmd = command[0].toUpperCase();
    
    switch (cmd) {
      case 'PING':
        connection.write("+PONG\r\n");
        break;
        
      case 'ECHO':
        if (command.length !== 2) {
          connection.write("-ERR wrong number of arguments for 'echo' command\r\n");
          return;
        }
        const message = command[1];
        connection.write(`$${message.length}\r\n${message}\r\n`);
        break;
        
      case 'SET':
        if (command.length !== 3) {
          connection.write("-ERR wrong number of arguments for 'set' command\r\n");
          return;
        }
        const key = command[1];
        const value = command[2];
        store.set(key, value);
        connection.write("+OK\r\n");  // RESP simple string
        break;
        
      case 'GET':
        if (command.length !== 2) {
          connection.write("-ERR wrong number of arguments for 'get' command\r\n");
          return;
        }
        const getKey = command[1];
        const val = store.get(getKey);
        
        if (val === undefined) {
          // Null bulk string for non-existent keys
          connection.write("$-1\r\n");
        } else {
          // RESP bulk string
          connection.write(`$${val.length}\r\n${val}\r\n`);
        }
        break;
        
      default:
        connection.write("-ERR unknown command\r\n");
    }
  });
});

function parseRESPCommand(input: string): string[] | null {
  const lines = input.split('\r\n');
  
  // Check if it's a RESP array (*<number>)
  if (!lines[0].startsWith('*')) {
    return null;
  }
  
  const numElements = parseInt(lines[0].slice(1));
  const elements: string[] = [];
  let lineIndex = 1;
  
  for (let i = 0; i < numElements; i++) {
    // Each element should be a bulk string ($<length>)
    if (!lines[lineIndex].startsWith('$')) {
      return null;
    }
    
    const length = parseInt(lines[lineIndex].slice(1));
    lineIndex++;
    
    // Get the actual string content
    elements.push(lines[lineIndex]);
    lineIndex++;
  }
  
  return elements;
}

server.listen(6379, () => {
  console.log("Redis server listening on port 6379");
});
