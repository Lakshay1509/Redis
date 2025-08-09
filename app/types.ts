import * as net from "net";
export type StoredValue = {
  value: string;
  expiresAt: number | undefined;
};
export type BlockingClient= {
  connection: net.Socket;
  key: string;
  timeout: number;
  startTime: number;
}

export type RESPCommand = string[];