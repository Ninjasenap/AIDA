/**
 * Todoist API Client
 *
 * Provides HTTP client with authentication, rate limiting, and error handling.
 */

import { randomUUID } from 'crypto';
import { getConfig } from './config';

// ============================================================================
// TYPES
// ============================================================================

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE';
  body?: unknown;
  params?: Record<string, string>;
  headers?: Record<string, string>;
  baseUrl?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_BASE_URL = 'https://api.todoist.com/rest/v2';
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 25;

// ============================================================================
// CLIENT
// ============================================================================

export class TodoistClient {
  private requestCount = 0;
  private windowStart = Date.now();
  private token: string;

  constructor(token?: string) {
    this.token = token || getConfig().apiToken;

    if (!this.token) {
      throw new Error('Todoist API token not configured');
    }
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    await this.enforceRateLimit();

    const url = this.buildUrl(endpoint, options);

    const response = await fetch(url, {
      method: options.method ?? 'GET',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        'X-Request-Id': randomUUID(),
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (response.status === 429) {
      await this.handleRateLimit();
      return this.request(endpoint, options);
    }

    if (!response.ok) {
      const body = await response.text();
      throw new TodoistApiError(response.status, body);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  private buildUrl(endpoint: string, options: RequestOptions): string {
    const baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    const url = endpoint.startsWith('http')
      ? new URL(endpoint)
      : new URL(`${baseUrl}${endpoint}`);

    if (options.params) {
      for (const [key, value] of Object.entries(options.params)) {
        url.searchParams.set(key, value);
      }
    }

    return url.toString();
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();

    if (now - this.windowStart > RATE_LIMIT_WINDOW_MS) {
      this.windowStart = now;
      this.requestCount = 0;
    }

    if (this.requestCount >= RATE_LIMIT_MAX_REQUESTS) {
      const waitTime = RATE_LIMIT_WINDOW_MS - (now - this.windowStart);
      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
      this.windowStart = Date.now();
      this.requestCount = 0;
    }

    this.requestCount += 1;
  }

  private async handleRateLimit(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 5_000));
  }
}

// ============================================================================
// ERRORS
// ============================================================================

export class TodoistApiError extends Error {
  constructor(
    public status: number,
    public body: string
  ) {
    super(`Todoist API Error ${status}: ${body}`);
    this.name = 'TodoistApiError';
  }
}
