declare module 'multer' {
  interface MulterOptions {
    dest?: string;
    storage?: StorageEngine;
    fileFilter?: (
      req: any,
      file: Express.Multer.File,
      callback: (error: Error | null, acceptFile: boolean) => void
    ) => void;
    limits?: {
      fileSize?: number;
      files?: number;
      fields?: number;
      fieldNameSize?: number;
      fieldSize?: number;
    };
    preservePath?: boolean;
  }

  interface StorageEngine {
    _handleFile(
      req: any,
      file: Express.Multer.File,
      callback: (error?: any, info?: Partial<Express.Multer.File>) => void
    ): void;
    _removeFile(
      req: any,
      file: Express.Multer.File,
      callback: (error: Error | null) => void
    ): void;
  }

  interface DiskStorageOptions {
    destination?:
      | string
      | ((
          req: any,
          file: Express.Multer.File,
          callback: (error: Error | null, destination: string) => void
        ) => void);
    filename?: (
      req: any,
      file: Express.Multer.File,
      callback: (error: Error | null, filename: string) => void
    ) => void;
  }

  function diskStorage(options: DiskStorageOptions): StorageEngine;
  function memoryStorage(): StorageEngine;

  interface Multer {
    single(fieldName: string): any;
    array(fieldName: string, maxCount?: number): any;
    fields(fields: { name: string; maxCount?: number }[]): any;
    none(): any;
    any(): any;
  }

  function multer(options?: MulterOptions): Multer;

  export = multer;
}
