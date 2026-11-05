"use client";
// R63 (doc 67): browser helpers for the user-management BFF routes. Errors keep the server's message.
export class UmError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function umFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    cache: "no-store",
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new UmError(
      res.status,
      body?.error || "FAILED",
      body?.message || "Something went wrong. Try again.",
    );
  return body as T;
}

export const profileLabel = (p?: string | null) =>
  p === "EVOQ CRM Manager" ? "Manager" : p === "EVOQ CRM User" ? "User" : "—";
