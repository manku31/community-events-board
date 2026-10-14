"use client";

const ACCESS_TOKEN_KEY = "accessToken";
let memoryToken: string | null = null;

export function storeAccessToken(token: string): void {
  memoryToken = token;
  try { window.sessionStorage.setItem(ACCESS_TOKEN_KEY, token); } catch {
    // Keep the session usable if this browser blocks storage.
  }
}

export function getAccessToken(): string | null {
  try { return window.sessionStorage.getItem(ACCESS_TOKEN_KEY) ?? memoryToken; } catch { return memoryToken; }
}

export function clearAccessToken(): void {
  memoryToken = null;
  try { window.sessionStorage.removeItem(ACCESS_TOKEN_KEY); } catch {
    // Storage may be blocked; the in-memory token has still been cleared.
  }
}
