// src/bitcore.d.ts
declare module 'bitcore-message' {
  import { Address, PublicKey } from 'bitcore-lib';

  class Message {
    static bitcore: any;
    constructor(message: string | Buffer);
    
    magicHash(): Buffer;
    sign(privateKey: bitcore.PrivateKey): string;
    verify(address: string | Address, signature: string): boolean;
    toObject(): { message: string };
    toJSON(): string;
    toString(): string;
    inspect(): string;
  }

  export = Message;
}