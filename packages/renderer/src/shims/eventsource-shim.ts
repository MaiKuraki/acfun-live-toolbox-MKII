// Browser shim for 'eventsource' package: return native EventSource when available.
const EventSourceShim: any = (typeof globalThis !== "undefined" && (globalThis as any).EventSource) ? (globalThis as any).EventSource : undefined;
export default EventSourceShim;


