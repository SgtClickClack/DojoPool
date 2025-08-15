/**
 * API client module.
 * Provides a wrapper around fetch for making HTTP requests.
 */
import { Config } from "../config";

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
  requiresAuth?: boolean;
}

interface ApiResponse<T = any> {
  data: T;
  status: number;
  ok: boolean;
  error?: string;
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = Config.API.BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get stored authentication token.
   */
  private getAuthToken(): string | null {
    return localStorage.getItem(Config.STORAGE.AUTH_TOKEN);
  }

  /**
   * Build full URL with query parameters.
   */
  private buildUrl(path: string, params?: Record<string, string>): string {
    const url = new URL(this.baseUrl + path, window.location.origin);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    return url.toString();
  }

  /**
   * Add authentication headers if required.
   */
  private addAuthHeader(headers: Headers, requiresAuth: boolean): void {
    if (requiresAuth) {
      const token = this.getAuthToken();
      if (!token) {
        throw new ApiError("Authentication required", 401);
      }
      headers.append("Authorization", `Bearer ${token}`);
    }
  }

  /**
   * Process API response.
   */
  private async processResponse<T>(
    response: Response,
  ): Promise<ApiResponse<T>> {
    const contentType = response.headers.get("content-type");
    const isJson = contentType?.includes("application/json");

    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      throw new ApiError(
        data.error || response.statusText,
        response.status,
        data,
      );
    }

    return {
      data,
      status: response.status,
      ok: response.ok,
    };
  }

  /**
   * Make HTTP request.
   */
  private async request<T>(
    path: string,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    const {
      params,
      requiresAuth = true,
      headers: customHeaders = {},
      ...fetchOptions
    } = options;

    const headers = new Headers({
      "Content-Type": "application/json",
      Accept: "application/json",
      ...customHeaders,
    });

    try {
      this.addAuthHeader(headers, requiresAuth);

      const response = await fetch(this.buildUrl(path, params), {
        ...fetchOptions,
        headers,
      });

      return await this.processResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(Config.ERRORS.NETWORK, 0);
    }
  }

  /**
   * Make GET request.
   */
  async get<T>(
    path: string,
    options: Omit<RequestOptions, "body" | "method"> = {},
  ): Promise<ApiResponse<T>> {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  /**
   * Make POST request.
   */
  async post<T>(
    path: string,
    data?: any,
    options: Omit<RequestOptions, "body" | "method"> = {},
  ): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      ...options,
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Make PUT request.
   */
  async put<T>(
    path: string,
    data?: any,
    options: Omit<RequestOptions, "body" | "method"> = {},
  ): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      ...options,
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  /**
   * Make PATCH request.
   */
  async patch<T>(
    path: string,
    data?: any,
    options: Omit<RequestOptions, "body" | "method"> = {},
  ): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  /**
   * Make DELETE request.
   */
  async delete<T>(
    path: string,
    options: Omit<RequestOptions, "body" | "method"> = {},
  ): Promise<ApiResponse<T>> {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }

  /**
   * Upload file.
   */
  async upload<T>(
    path: string,
    file: File,
    options: Omit<RequestOptions, "body" | "method" | "headers"> = {},
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append("file", file);

    return this.request<T>(path, {
      ...options,
      method: "POST",
      body: formData,
      headers: {}, // Let browser set correct Content-Type
    });
  }
}

// Create and export default instance
export const api = new ApiClient();
