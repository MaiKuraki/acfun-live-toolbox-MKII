import { createRequire } from 'module';
import { app } from 'electron';
import * as path from 'path';
const require = createRequire(import.meta.url);

if (process.env.NODE_ENV === 'development' || process.env.PLAYWRIGHT_TEST === 'true' || !!process.env.CI) {
  function showAndExit(...args) {
    console.error(...args);
    process.exit(1);
  }

  process.on('uncaughtException', showAndExit);
  process.on('unhandledRejection', showAndExit);
}

// 获取主进程模块路径（兼容开发环境和打包后环境）
function getMainModulePath() {
  if (app.isPackaged) {
    // 打包后环境：使用 Electron 内置的 resourcesPath
    return path.join(process.resourcesPath, 'app', 'packages', 'main', 'dist', 'index.cjs');
  }

  // 开发环境：使用 workspace 路径
  return '@app/main';
}

// 直接加载并运行主进程模块（其为 CJS，导出为 side-effect 入口）
require(getMainModulePath());
