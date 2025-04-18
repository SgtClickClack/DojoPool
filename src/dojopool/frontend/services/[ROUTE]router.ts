import stateService from "./state";
import analyticsService from "./analytics";

interface RouteParams {
  [key: string]: string;
}

interface QueryParams {
  [key: string]: string | string[];
}

interface RouteState {
  [key: string]: any;
}

interface Route {
  path: string;
  name: string;
  component: any;
  meta?: {
    title?: string;
    requiresAuth?: boolean;
    roles?: string[];
    layout?: string;
    [key: string]: any;
  };
  beforeEnter?: (to: Route, from: Route | null) => boolean | Promise<boolean>;
  beforeLeave?: (to: Route, from: Route) => boolean | Promise<boolean>;
}

interface RouterState {
  currentRoute: Route | null;
  previousRoute: Route | null;
  params: RouteParams;
  query: QueryParams;
  state: RouteState;
  isNavigating: boolean;
}

interface NavigationOptions {
  replace?: boolean;
  state?: RouteState;
  preserveQuery?: boolean;
  preserveState?: boolean;
}

class RouterService {
  private routes: Map<string, Route> = new Map();
  private state: RouterState = {
    currentRoute: null,
    previousRoute: null,
    params: {},
    query: {},
    state: {},
    isNavigating: false,
  };
  private listeners: Set<(state: RouterState) => void> = new Set();
  private readonly PARAM_REGEX = /:([^/]+)/g;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    // Setup popstate listener
    window.addEventListener("popstate", this.handlePopState.bind(this));

    // Handle initial route
    this.handleInitialRoute();

    // Track initialization
    analyticsService.trackUserEvent({
      type: "router_initialized",
      userId: "system",
      details: {
        timestamp: new Date().toISOString(),
      },
    });
  }

  private handleInitialRoute(): void {
    const path = window.location.pathname;
    const query = this.parseQueryString(window.location.search);
    const state = window.history.state || {};

    this.matchRoute(path, query, state);
  }

  private handlePopState(event: PopStateEvent): void {
    const path = window.location.pathname;
    const query = this.parseQueryString(window.location.search);
    const state = event.state || {};

    this.matchRoute(path, query, state);
  }

  private async matchRoute(
    path: string,
    query: QueryParams,
    state: RouteState,
  ): Promise<void> {
    for (const route of this.routes.values()) {
      const match = this.matchPath(route.path, path);
      if (match) {
        await this.navigateToRoute(route, match, query, state);
        break;
      }
    }
  }

  private matchPath(
    routePath: string,
    currentPath: string,
  ): RouteParams | null {
    const routeParts = routePath.split("/");
    const currentParts = currentPath.split("/");

    if (routeParts.length !== currentParts.length) {
      return null;
    }

    const params: RouteParams = {};

    for (let i = 0; i < routeParts.length; i++) {
      const routePart = routeParts[i];
      const currentPart = currentParts[i];

      if (routePart.startsWith(":")) {
        params[routePart.slice(1)] = currentPart;
      } else if (routePart !== currentPart) {
        return null;
      }
    }

    return params;
  }

  private parseQueryString(queryString: string): QueryParams {
    const query: QueryParams = {};
    const searchParams = new URLSearchParams(queryString);

    searchParams.forEach((value, key) => {
      if (query[key]) {
        if (Array.isArray(query[key])) {
          (query[key] as string[]).push(value);
        } else {
          query[key] = [query[key] as string, value];
        }
      } else {
        query[key] = value;
      }
    });

    return query;
  }

  private buildQueryString(query: QueryParams): string {
    const params = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, v));
      } else {
        params.append(key, value);
      }
    });

    const queryString = params.toString();
    return queryString ? `?${queryString}` : "";
  }

  private async navigateToRoute(
    route: Route,
    params: RouteParams,
    query: QueryParams,
    state: RouteState,
  ): Promise<void> {
    if (this.state.isNavigating) {
      return;
    }

    this.state.isNavigating = true;

    try {
      // Check beforeLeave hook
      if (this.state.currentRoute?.beforeLeave) {
        const canLeave = await this.state.currentRoute.beforeLeave(
          route,
          this.state.currentRoute,
        );
        if (!canLeave) {
          return;
        }
      }

      // Check beforeEnter hook
      if (route.beforeEnter) {
        const canEnter = await route.beforeEnter(
          route,
          this.state.currentRoute,
        );
        if (!canEnter) {
          return;
        }
      }

      // Update state
      this.state.previousRoute = this.state.currentRoute;
      this.state.currentRoute = route;
      this.state.params = params;
      this.state.query = query;
      this.state.state = state;

      // Update document title
      if (route.meta?.title) {
        document.title = route.meta.title;
      }

      // Notify listeners
      this.notifyListeners();

      // Track navigation
      analyticsService.trackUserEvent({
        type: "route_changed",
        userId: "system",
        details: {
          from: this.state.previousRoute?.path,
          to: route.path,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Navigation error:", error);

      // Track navigation error
      analyticsService.trackUserEvent({
        type: "route_change_error",
        userId: "system",
        details: {
          from: this.state.previousRoute?.path,
          to: route.path,
          error: error.message,
          timestamp: new Date().toISOString(),
        },
      });
    } finally {
      this.state.isNavigating = false;
    }
  }

  public registerRoute(route: Route): void {
    if (this.routes.has(route.path)) {
      throw new Error(`Route with path ${route.path} already exists`);
    }

    this.routes.set(route.path, route);

    // Track route registration
    analyticsService.trackUserEvent({
      type: "route_registered",
      userId: "system",
      details: {
        path: route.path,
        name: route.name,
        timestamp: new Date().toISOString(),
      },
    });
  }

  public registerRoutes(routes: Route[]): void {
    routes.forEach((route) => this.registerRoute(route));
  }

  public async navigate(
    path: string,
    options: NavigationOptions = {},
  ): Promise<void> {
    const {
      replace = false,
      state = {},
      preserveQuery = false,
      preserveState = false,
    } = options;

    // Build query string
    const query = preserveQuery ? this.state.query : {};
    const queryString = this.buildQueryString(query);

    // Build state
    const newState = preserveState ? { ...this.state.state, ...state } : state;

    // Find matching route
    for (const route of this.routes.values()) {
      const match = this.matchPath(route.path, path);
      if (match) {
        // Update history
        const url = `${path}${queryString}`;
        if (replace) {
          window.history.replaceState(newState, "", url);
        } else {
          window.history.pushState(newState, "", url);
        }

        // Navigate to route
        await this.navigateToRoute(route, match, query, newState);
        break;
      }
    }
  }

  public async back(): Promise<void> {
    window.history.back();
  }

  public async forward(): Promise<void> {
    window.history.forward();
  }

  public getCurrentRoute(): Route | null {
    return this.state.currentRoute;
  }

  public getPreviousRoute(): Route | null {
    return this.state.previousRoute;
  }

  public getParams(): RouteParams {
    return { ...this.state.params };
  }

  public getQuery(): QueryParams {
    return { ...this.state.query };
  }

  public getState(): RouteState {
    return { ...this.state.state };
  }

  public isNavigating(): boolean {
    return this.state.isNavigating;
  }

  public addListener(listener: (state: RouterState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.state));
  }
}

// Create a singleton instance
const routerService = new RouterService();

export default routerService;
