import { describe, expect, it, vi } from "vitest";
import { ApiError, NETWORK_ERROR_STATUS, request, toApiError } from "./client";

const respond = (status: number, body?: unknown) =>
  vi.fn(async () => new Response(body === undefined ? null : JSON.stringify(body), { status }));

describe("request", () => {
  it("sends JSON and parses the response", async () => {
    const fetchMock = respond(201, { id: 1 });
    vi.stubGlobal("fetch", fetchMock);

    const result = await request<{ id: number }>("/todos", { method: "POST", body: { title: "A" } });

    expect(result).toEqual({ id: 1 });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://localhost:8000/todos");
    expect(init.body).toBe('{"title":"A"}');
    expect(init.headers).toMatchObject({ "Content-Type": "application/json" });
  });

  it("does not send a Content-Type header without a body", async () => {
    const fetchMock = respond(200, []);
    vi.stubGlobal("fetch", fetchMock);

    await request("/todos");

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.headers).not.toHaveProperty("Content-Type");
  });

  it("returns undefined for 204 No Content", async () => {
    vi.stubGlobal("fetch", respond(204));

    await expect(request("/todos/1", { method: "DELETE" })).resolves.toBeUndefined();
  });

  it("throws an ApiError with the status and the backend detail", async () => {
    vi.stubGlobal("fetch", respond(404, { detail: "Todo 9 not found" }));

    const error = await request("/todos/9").catch((err: unknown) => err);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 404, detail: { detail: "Todo 9 not found" } });
  });

  it("turns network failures into an ApiError with status 0", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    const error = (await request("/todos").catch((err: unknown) => err)) as ApiError;

    expect(error.status).toBe(NETWORK_ERROR_STATUS);
    expect(error.isNetworkError).toBe(true);
  });

  it("rethrows aborts untouched so callers can ignore them", async () => {
    const controller = new AbortController();
    controller.abort();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("Aborted", "AbortError")));

    const error = await request("/todos", { signal: controller.signal }).catch((err: unknown) => err);

    expect(error).not.toBeInstanceOf(ApiError);
    expect((error as Error).name).toBe("AbortError");
  });
});

describe("toApiError", () => {
  it("keeps ApiErrors and wraps anything else", () => {
    const original = new ApiError(500, "boom");

    expect(toApiError(original)).toBe(original);
    expect(toApiError(new Error("x"))).toMatchObject({ status: NETWORK_ERROR_STATUS, message: "x" });
  });
});
