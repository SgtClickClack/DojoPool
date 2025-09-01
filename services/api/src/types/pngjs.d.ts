declare module 'pngjs' {
  export class PNG {
    constructor(options?: any);
    parse(data: Buffer): void;
    pack(): void;
    width: number;
    height: number;
    data: Buffer;
  }
}
