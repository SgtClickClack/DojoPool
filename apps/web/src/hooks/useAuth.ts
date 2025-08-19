// Temporary stub for useAuth during frontend unification.
// Replace with real auth context/provider during integration.
export type AuthUser = {
  id?: string;
  name?: string;
  email?: string;
  roles?: string[];
};

export function useAuth(): { user: AuthUser | null; isAdmin: boolean } {
  // This stub assumes no authenticated user; adjust when real auth is wired.
  return { user: null, isAdmin: false };
}
