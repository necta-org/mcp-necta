import { config } from "../config.js";

interface RequestOptions {
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  path: string;
  body?: Record<string, unknown>;
  query?: Record<string, string | string[] | undefined>;
  headers?: Record<string, string>;
}

export async function makeRequest<T = unknown>(options: RequestOptions): Promise<T> {
  const { method, path, body, query, headers } = options;

  if (!config.apiKey) {
    throw new Error("NECTA_API_KEY is not configured. Set the NECTA_API_KEY environment variable.");
  }

  const url = new URL(path, config.apiUrl);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) {
        for (const v of value) {
          url.searchParams.append(key, v);
        }
      } else {
        url.searchParams.set(key, value);
      }
    }
  }

  const response = await fetch(url.toString(), {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorBody}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
