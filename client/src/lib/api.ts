const configuredApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();

export const API_BASE_URL = configuredApiUrl?.replace(/\/+$/, "") ?? "";

export function apiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function assetUrl(path: string | null | undefined): string {
  if (!path) return "";
  return apiUrl(path);
}

export function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  return fetch(apiUrl(input), {
    ...init,
    credentials: "include",
  });
}