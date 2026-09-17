import type { Paginated, PaginationMeta } from "@/types/api";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const TOKEN_STORAGE_KEY = "igreja.token";
const USER_STORAGE_KEY = "igreja.user";

/** Fired when the API rejects the stored token, so the AuthProvider can log out. */
export const UNAUTHORIZED_EVENT = "igreja:unauthorized";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: Array<{ path: string; message: string }>;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: Array<{ path: string; message: string }>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** Field-keyed messages, ready to drop into a form. */
  get fieldErrors(): Record<string, string> {
    const map: Record<string, string> = {};
    for (const detail of this.details ?? []) {
      if (!map[detail.path]) map[detail.path] = detail.message;
    }
    return map;
  }
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function storeSession(token: string, user: unknown): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function getStoredUser<T>(): T | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(USER_STORAGE_KEY);
}

export type QueryParams = Record<
  string,
  string | number | boolean | null | undefined
>;

/** Drops null/undefined/empty values so `?status=` never reaches the API. */
export function buildQuery(params?: QueryParams): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

interface RawResponse<T> {
  data: T;
  meta?: PaginationMeta;
}

async function request<T>(
  path: string,
  init: RequestInit & { params?: QueryParams } = {},
): Promise<RawResponse<T>> {
  const { params, headers, ...rest } = init;
  const token = getStoredToken();

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}${buildQuery(params)}`, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "Não foi possível falar com o servidor. Verifique se a API está rodando na porta 4000.",
    );
  }

  if (response.status === 204) {
    return { data: undefined as T };
  }

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as Record<string, unknown>) : {};

  if (!response.ok) {
    const error = (payload.error ?? {}) as {
      code?: string;
      message?: string;
      details?: Array<{ path: string; message: string }>;
    };

    // The stored token is dead — let the AuthProvider tear the session down.
    if (response.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    }

    throw new ApiError(
      response.status,
      error.code ?? "INTERNAL_ERROR",
      error.message ?? "Erro inesperado ao comunicar com o servidor.",
      error.details,
    );
  }

  return payload as unknown as RawResponse<T>;
}

export async function apiGet<T>(path: string, params?: QueryParams): Promise<T> {
  const result = await request<T>(path, { method: "GET", params });
  return result.data;
}

export async function apiGetPaginated<T>(
  path: string,
  params?: QueryParams,
): Promise<Paginated<T>> {
  const result = await request<T[]>(path, { method: "GET", params });
  return {
    items: result.data ?? [],
    meta: result.meta ?? { page: 1, pageSize: 20, total: 0, totalPages: 0 },
  };
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const result = await request<T>(path, {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return result.data;
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  const result = await request<T>(path, {
    method: "PATCH",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return result.data;
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  const result = await request<T>(path, {
    method: "PUT",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return result.data;
}

export async function apiDelete(path: string): Promise<void> {
  await request<void>(path, { method: "DELETE" });
}
