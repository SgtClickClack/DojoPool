declare module 'formidable' {
  import { IncomingMessage } from 'http';
  import { EventEmitter } from 'events';

  export interface File {
    filepath: string;
    originalFilename: string;
    newFilename: string;
    mimetype: string;
    size: number;
    [key: string]: any;
  }

  export interface Options {
    encoding?: string;
    uploadDir?: string;
    keepExtensions?: boolean;
    maxFileSize?: number;
    maxFieldsSize?: number;
    maxFields?: number;
    hash?: boolean | string;
    multiples?: boolean;
    [key: string]: any;
  }

  export interface Fields {
    [key: string]: string | string[];
  }

  export interface Files {
    [key: string]: File | File[];
  }

  export type Callback = (err: Error | null, fields: Fields, files: Files) => void;

  export class IncomingForm extends EventEmitter {
    constructor(options?: Options);
    parse(req: IncomingMessage, callback?: Callback): void;
    onPart(part: any): void;
  }

  export function parse(req: IncomingMessage, options?: Options): Promise<{ fields: Fields, files: Files }>;
}