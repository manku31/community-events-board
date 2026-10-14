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
