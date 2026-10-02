const DEFAULT_API_URL = "http://localhost:8000";

export const API_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/+$/, "");

/** Status used when the request never got an HTTP response (offline, CORS, server down). */
export const NETWORK_ERROR_STATUS = 0;

export class ApiError extends Error {
  readonly status: number;
  readonly detail: unknown;

  constructor(status: number, message: string, detail?: unknown, options?: ErrorOptions) {
    super(message, options);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }

  get isNetworkError(): boolean {
    return this.status === NETWORK_ERROR_STATUS;
  }
}

/** Normalizes any thrown value into an ApiError so callers handle a single error type. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  const message = error instanceof Error ? error.message : "Unexpected error";
  return new ApiError(NETWORK_ERROR_STATUS, message, undefined, { cause: error });
}

type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown };

/**
 * Performs a JSON request against the API.
 * Throws ApiError for network failures and non-2xx responses; aborted requests
 * rethrow the original AbortError so callers can ignore them.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...init } = options;
  const hasBody = body !== undefined;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(hasBody && { "Content-Type": "application/json" }),
        ...headers,
      },
      body: hasBody ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (init.signal?.aborted) throw error;
    throw new ApiError(NETWORK_ERROR_STATUS, "Could not reach the server", undefined, {
      cause: error,
    });
  }

  if (!response.ok) {
    const detail = await readJson(response);
    throw new ApiError(response.status, `Request failed with status ${response.status}`, detail);
  }

  if (response.status === 204) return undefined as T;
  return (await readJson(response)) as T;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}
