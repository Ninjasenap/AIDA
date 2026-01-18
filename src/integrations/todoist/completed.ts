/**
 * Todoist Completed Tasks (Sync API)
 */

import { getConfig } from './config';
import type { TodoistCompletedItem } from './types';

// ============================================================================
// TYPES
// ============================================================================

interface CompletedResponse {
  items: TodoistCompletedItem[];
}

// ============================================================================
// API
// ============================================================================

const SYNC_API_URL = 'https://api.todoist.com/sync/v9/completed/get_all';

export async function getCompletedSince(since: string, limit = 50): Promise<TodoistCompletedItem[]> {
  const config = getConfig();

  if (!config.apiToken) {
    throw new Error('Todoist API token not configured');
  }

  const body = new URLSearchParams({
    since,
    limit: String(limit),
  });

  const response = await fetch(SYNC_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Todoist Sync API Error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as CompletedResponse;
  return data.items ?? [];
}
