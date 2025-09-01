declare module 'pngjs' {
  export interface PNGOptions {
    width?: number;
    height?: number;
    bitDepth?: number;
    colorType?: number;
    inputColorType?: number;
    inputHasAlpha?: boolean;
    deflateChunkSize?: number;
    deflateLevel?: number;
    deflateStrategy?: number;
    filterType?: number;
    deflateChunkSize?: number;
    deflateLevel?: number;
    deflateStrategy?: number;
    colorType?: number;
    inputColorType?: number;
    inputHasAlpha?: boolean;
  }

  export class PNG extends NodeJS.EventEmitter {
    constructor(options?: PNGOptions);

    width: number;
    height: number;
    bitDepth: number;
    colorType: number;
    data: Buffer;

    static sync: {
      read(buffer: Buffer): PNG;
      write(png: PNG): Buffer;
    };

    on(
      event: 'metadata',
      listener: (metadata: { width: number; height: number }) => void
    ): this;
    on(event: 'parsed', listener: (data: Buffer) => void): this;
    on(event: 'error', listener: (error: Error) => void): this;

    parse(
      data: Buffer,
      callback?: (error: Error | null, png?: PNG) => void
    ): void;
    pack(): NodeJS.ReadableStream;
  }
}
