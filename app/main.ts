import * as net from "net";

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");


const server: net.Server = net.createServer((connection: net.Socket) => {
  connection.on("data", (data: Buffer) => {
    const input = data.toString();
    
    // Parse RESP command
    const command = parseRESPCommand(input);
    if (!command) return;
    
    const cmd = command[0].toUpperCase();
    
    if (cmd === 'PING') {
      connection.write("+PONG\r\n");
    } else if (cmd === 'ECHO') {
      if (command.length !== 2) {
        connection.write("-ERR wrong number of arguments for 'echo' command\r\n");
        return;
      }
      
      const message = command[1];
      const response = `$${message.length}\r\n${message}\r\n`;
      connection.write(response);
    } else {
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



server.listen(6379, "127.0.0.1");
