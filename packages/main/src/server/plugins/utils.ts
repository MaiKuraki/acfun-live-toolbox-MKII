import * as fs from "fs";
import * as path from "path";
import type express from "express";

export function sendNoCacheHeaders(res: express.Response): void {
  try {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  } catch {}
}

export function safeSendFile(res: express.Response, resolved: string): express.Response | void {
  try {
    sendNoCacheHeaders(res);
  } catch {}
  try {
    return res.sendFile(resolved);
  } catch {
    // fallback - end silently, caller should handle response if needed
  }
}

export function validatePluginId(pluginId: unknown): string | null {
  const id = typeof pluginId === "string" ? pluginId.trim() : "";
  return id || null;
}

export function normalizeArrayOfStrings(raw: any): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((x) => String(x || "").trim()).filter(Boolean);
}

export function ensureDirIsInside(root: string, target: string): boolean {
  try {
    const installRoot = path.resolve(root);
    const resolved = path.resolve(target);
    return resolved.startsWith(installRoot);
  } catch {
    return false;
  }
}

export function fileExists(p: string): boolean {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}











