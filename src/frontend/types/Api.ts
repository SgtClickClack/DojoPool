// Shared API response types
export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}

// Generic list wrapper some endpoints use
export interface ListEnvelope<T> {
  data: {
    items?: T[];
    tournaments?: T[];
    results?: T[];
    [key: string]: unknown;
  };
}
