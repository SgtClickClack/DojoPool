/*
  Ambient type shims to satisfy the TypeScript compiler for external modules
  that may be missing or unresolved in the current build context.
  These are intentionally permissive and should be replaced with proper types
  as the codebase stabilizes.
*/

/* eslint-disable @typescript-eslint/no-explicit-any */

// Core libraries that may fail resolution in isolated contexts
declare module 'axios' {
  const axios: any;
  export default axios;
  export const AxiosError: any;
  export type AxiosInstance = any;
  export type AxiosRequestConfig = any;
}

// Firebase v9+ modular imports (ambient fallbacks)
declare module 'firebase/app' {
  export const initializeApp: any;
  export const getApps: any;
  export type FirebaseApp = any;
  const app: any;
  export default app;
}

declare module 'firebase/auth' {
  export const getAuth: any;
  export const onAuthStateChanged: any;
  export const onIdTokenChanged: any;
  export const GoogleAuthProvider: any;
  export const createUserWithEmailAndPassword: any;
  export const signInWithEmailAndPassword: any;
  export const sendPasswordResetEmail: any;
  export const updateProfile: any;
  export const setPersistence: any;
  export const browserLocalPersistence: any;
  export const signInWithPopup: any;
  export const signOut: any;
  export type Auth = any;
  export type User = any;
}

declare module 'firebase/firestore' {
  export const getFirestore: any;
  export const doc: any;
  export const getDoc: any;
  export const setDoc: any;
  export const collection: any;
  export const getDocs: any;
  export const addDoc: any;
  export const updateDoc: any;
  export const query: any;
  export const where: any;
  export const onSnapshot: any;
  export type Firestore = any;
}

declare module 'firebase/storage' {
  export const getStorage: any;
  export const ref: any;
  export const uploadBytes: any;
  export const getDownloadURL: any;
  export type FirebaseStorage = any;
}

// Real-time and notifications
declare module 'socket.io-client' {
  export const io: any;
  export type Socket = any;
  const defaultExport: any;
  export default defaultExport;
}

declare module 'notistack' {
  export const useSnackbar: any;
  export const SnackbarProvider: any;
}

// Compression utility
declare module 'pako' {
  const pako: any;
  export default pako;
}

// TanStack React Query (v5) - permissive fallbacks if used
declare module '@tanstack/react-query' {
  export const useQuery: any;
  export const useMutation: any;
  export const useQueryClient: any;
  export class QueryClient {
    constructor(...args: any[]);
  }
  export const QueryClientProvider: any;
}

// React Three Fiber minimal helpers used by three-extensions
declare module '@react-three/fiber' {
  export const extend: any;
  export const Canvas: any;
  export const useFrame: any;
  export const useThree: any;
  export const useLoader: any;
}

// Common asset module shims
declare module '*.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.gif' {
  const src: string;
  export default src;
}

declare module '*.webp' {
  const src: string;
  export default src;
}

declare module '*.mp4' {
  const src: string;
  export default src;
}

declare module '*.mp3' {
  const src: string;
  export default src;
}

declare module '*.wav' {
  const src: string;
  export default src;
}

declare module '*.json' {
  const value: any;
  export default value;
}

// Local relative module used by packages/types that may not resolve in this context
// This prevents TS2307 when packages/types references VectorClock.js internally.
declare module '../core/consistency/VectorClock.js' {
  export type VectorTimestamp = any;
  const VectorClock: any;
  export default VectorClock;
}

// Ambient modules for monorepo shared types to avoid pulling their internal deps
// These declarations satisfy imports in the frontend like '../../../packages/types/src/types/*'
// without TypeScript traversing into packages/types and its internal relative imports.

declare module '../../../packages/types/src/types/rewards' {
  export type RewardItem = any;
}

declare module '../../../../packages/types/src/types/rewards' {
  export type RewardItem = any;
}

declare module '../../../packages/types/src/types/tournament' {
  export type Tournament = any;
}

declare module '../../../../packages/types/src/types/game' {
  export type Game = any;
}
