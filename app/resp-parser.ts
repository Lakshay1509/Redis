import type { RESPCommand } from './types';

export function parseRESPCommand(input: string): RESPCommand | null {
  const lines = input.split("\r\n");

  // Check if it's a RESP array (*<number>)
  if (!lines[0].startsWith("*")) {
    return null;
  }

  const numElements = parseInt(lines[0].slice(1));
  const elements: string[] = [];
  let lineIndex = 1;

  for (let i = 0; i < numElements; i++) {
    // Each element should be a bulk string ($<length>)
    if (!lines[lineIndex].startsWith("$")) {
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

export function formatRESPString(str: string): string {
  return `$${str.length}\r\n${str}\r\n`;
}

export function formatRESPError(message: string): string {
  return `-ERR ${message}\r\n`;
}

export function formatRESPSimpleString(str: string): string {
  return `+${str}\r\n`;
}

export function formatRESPNull(): string {
  return "$-1\r\n";
}

export function formatRESPInt(num: number): string {
    return `:${num}\r\n`;
}
