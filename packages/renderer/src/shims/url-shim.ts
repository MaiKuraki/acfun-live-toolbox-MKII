// Minimal shim for Node's `url` module used by some libraries (e.g. eventsource)
// Uses WHATWG URL under the hood and provides `parse` and `format` compatible APIs.
export function parse(input: string, parseQueryString = false) {
  try {
    const u = new URL(input);
    const pathname = u.pathname || '';
    const search = u.search || '';
    const query = parseQueryString ? Object.fromEntries(u.searchParams.entries()) : search.replace(/^\?/, '');
    return {
      href: u.href,
      protocol: u.protocol,
      auth: u.username ? (u.username + (u.password ? ':' + u.password : '')) : null,
      host: u.host,
      port: u.port,
      hostname: u.hostname,
      hash: u.hash,
      search,
      query,
      pathname,
      path: pathname + search,
      hrefRaw: u.href,
    } as any;
  } catch {
    return { href: input, path: input } as any;
  }
}

export function format(obj: any) {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  try {
    if (obj.href) return String(obj.href);
    const protocol = obj.protocol || '';
    const host = obj.host || obj.hostname || '';
    const pathname = obj.pathname || obj.path || '';
    const search = obj.search || (obj.query && typeof obj.query === 'string' ? obj.query : '');
    const href = `${protocol}//${host}${pathname}${search ? (search.startsWith('?') ? search : '?' + search) : ''}`;
    return href;
  } catch {
    return '';
  }
}

export const URLShim = globalThis.URL;

export default {
  parse,
  format,
  URL: URLShim,
};


