import type { ApiContext } from "./context";
import { registerHealth } from "./health";
import { registerEvents } from "./events";
import { registerSystem } from "./system";
import { registerWindows } from "./windows";
import { registerFs } from "./fs";
import { registerShortcuts } from "./shortcuts";
import { registerLogger } from "./logger";
import { registerConsole } from "./console";
import { registerPlugins } from "./plugins";
import { registerProxy } from "./proxy";
import { registerSse } from "./sse";
import { registerRendererStore } from "./rendererStore";
import { registerStatic } from "./static";

export function registerAll(context: ApiContext): void {
  registerStatic(context);
  registerHealth(context);
  registerEvents(context);
  registerConsole(context);
  registerLogger(context);
  registerSystem(context);
  registerWindows(context);
  registerFs(context);
  registerShortcuts(context);
  registerPlugins(context);
  registerProxy(context);
  registerRendererStore(context);
  registerSse(context);
}

