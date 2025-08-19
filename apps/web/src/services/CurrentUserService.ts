export interface CurrentUser {
  id: string;
  username: string;
  avatarUrl: string;
}

class CurrentUserService {
  private static readonly STORAGE_KEY = 'dojopool_current_user';

  static getCurrentUser(): CurrentUser {
    // SSR-safe fallback
    const fallback: CurrentUser = {
      id: '1',
      username: 'RyuKlaw',
      avatarUrl: 'https://via.placeholder.com/40x40/ff6b6b/ffffff?text=RK',
    };

    if (typeof window === 'undefined') {
      return fallback;
    }

    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw) as CurrentUser;
      }
    } catch (e) {
      console.warn('CurrentUserService: failed to parse stored user, using default', e);
    }

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(fallback));
    } catch {}
    return fallback;
  }

  static setCurrentUser(user: CurrentUser) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
      // notify listeners in this tab as well
      window.dispatchEvent(new CustomEvent('dojopool:user:update', { detail: user }));
    } catch (e) {
      console.error('CurrentUserService: failed to set user', e);
    }
  }
}

export { CurrentUserService };
