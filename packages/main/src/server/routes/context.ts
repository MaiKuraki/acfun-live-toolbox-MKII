import type express from "express";
import type { ApiServerConfig } from "../ApiServer";
import type { QueryService } from "../../persistence/QueryService";
import type { CsvExporter } from "../../persistence/CsvExporter";
import type { DiagnosticsService } from "../../logging/DiagnosticsService";
import type { OverlayManager } from "../../plugins/OverlayManager";
import type { IPluginManager, IConsoleManager } from "../../types/contracts";
import type { WindowManager } from "../../bootstrap/WindowManager";
import type { PluginWindowManager } from "../../plugins/PluginWindowManager";
import type { IDataManager } from "../../persistence/DataManager";
import type { AcfunApiProxy } from "../AcfunApiProxy";
import type { RequestHandler } from "express";

export interface ApiContext {
  app: express.Application;
  config: ApiServerConfig;
  queryService: QueryService;
  csvExporter: CsvExporter;
  diagnosticsService: DiagnosticsService;
  overlayManager: OverlayManager;
  consoleManager: IConsoleManager;
  acfunApiProxy: AcfunApiProxy;
  pluginManager?: IPluginManager;
  dataManager: IDataManager;
  windowManager?: WindowManager;
  pluginWindowManager?: PluginWindowManager;
  getWindowManager?: () => WindowManager | undefined;
  getPluginWindowManager?: () => PluginWindowManager | undefined;
  getPluginManager?: () => IPluginManager | undefined;
  pluginRoutes: Map<string, { method: "GET" | "POST"; path: string; handler: RequestHandler }[]>;
}
