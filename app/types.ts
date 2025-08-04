export type StoredValue = {
  value: string;
  expiresAt: number | undefined;
};

export type RESPCommand = string[];