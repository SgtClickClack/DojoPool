// Reference removed: vite/client (project standardized on Next.js)

interface ImportMetaEnv {
  readonly MODE: string;
  readonly VITE_PORT?: string;
  readonly VITE_DATABASE_URL?: string;
  readonly VITE_JWT_SECRET?: string;
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  readonly VITE_OPENAI_API_KEY?: string;
  readonly VITE_AWS_ACCESS_KEY_ID?: string;
  readonly VITE_AWS_SECRET_ACCESS_KEY?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_GA_TRACKING_ID?: string;
  readonly VITE_DOJO_COIN_ADDRESS?: string;
  readonly VITE_ENCRYPTION_KEY?: string;
  readonly VITE_WEBSOCKET_URL?: string;
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID?: string;
  readonly VITE_3DAI_STUDIO_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
