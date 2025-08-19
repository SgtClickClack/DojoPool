export interface User {
  id: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  token?: string; // app-side auth token or Firebase ID token
}
