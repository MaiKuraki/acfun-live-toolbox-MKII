import * as fs from "fs";
import * as path from "path";
import type express from "express";
import { sendNoCacheHeaders } from "./utils";

const htmlInjectionCache: Map<string, { mtime: number; content: string }> = new Map();

export async function serveHtmlWithInjection(plugin: any, resolved: string, req: express.Request, res: express.Response, resourceBaseHint?: string): Promise<boolean> {
  try {
    const stat = fs.statSync(resolved);
    const mtime = stat.mtimeMs || 0;
    const cacheKey = resolved;
    const cached = htmlInjectionCache.get(cacheKey);
    if (cached && cached.mtime === mtime) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(cached.content);
      return true;
    }

    let htmlStr = fs.readFileSync(resolved, "utf8");
    const manifest: any = plugin.manifest || {};
    if (manifest && manifest.spa === true) {
      const htmlRel = path.relative(plugin.installPath, resolved).replace(/\\/g, "/");
      const declaredDir = htmlRel.includes("/") ? path.dirname(htmlRel) : undefined;
      const resourceBase = declaredDir && declaredDir !== "." ? declaredDir : (resourceBaseHint || "");
      const base = `/plugins/${String(plugin.id || "")}/${resourceBase ? `${resourceBase}/` : ""}`;

      // Try using html-to-json-parser if available
      try {
        // Pre-sanitize boolean attributes that XML parsers (xmldom) complain about,
        // e.g. `crossorigin` with no value. Convert to explicit value to avoid warnings.
        try {
          htmlStr = htmlStr.replace(/\s+crossorigin(?=[\s>])/gi, ' crossorigin="anonymous"');
        } catch (_) { /* noop */ }
        const parser = require("html-to-json-parser");
        if (parser && typeof parser.HTMLToJSON === "function" && typeof parser.JSONToHTML === "function") {
          const json = await parser.HTMLToJSON(htmlStr, false);
          if (json && Array.isArray(json.content)) {
            for (const el of json.content) {
              if (el && el.type === "head") {
                const hasBase = Array.isArray(el.content) && el.content.some((c: any) => c && c.type === "base");
                if (hasBase) {
                  // replace first base href
                  for (const child of el.content) {
                    if (child && child.type === "base") {
                      child.attributes = { ...(child.attributes || {}), href: base };
                      break;
                    }
                  }
                } else {
                  el.content = el.content || [];
                  el.content.unshift({ type: "base", attributes: { href: base } });
                }
                break;
              }
            }
            htmlStr = await parser.JSONToHTML(json, true);
          }
        }
      } catch (e) {
        // fallback to simple regex replacement
        if (/<base\s+[^>]*>/i.test(htmlStr)) {
          htmlStr = htmlStr.replace(/<base\s+[^>]*>/i, `<base href="${base}">`);
        } else {
          htmlStr = htmlStr.replace(/<head([^>]*)>/i, `<head$1><base href="${base}">`);
        }
      }
    }

    try {
      sendNoCacheHeaders(res);
    } catch {}
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    htmlInjectionCache.set(cacheKey, { mtime, content: htmlStr });
    res.send(htmlStr);
    return true;
  } catch (err) {
    return false;
  }
}


