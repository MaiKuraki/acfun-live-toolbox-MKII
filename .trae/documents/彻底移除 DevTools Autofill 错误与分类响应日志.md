## 目标
- 终端不再打印 DevTools 的 Autofill 错误（“Request Autofill.enable/setAddresses failed”）。
- 终端不再出现“getLiveCategories API response: ...”的完整响应日志。

## 原因与现状
- 错误来源：在开发模式自动打开 DevTools（主窗口与插件窗口），其内部脚本尝试调用未支持的 CDP 域，导致 Chromium 将错误直接写入终端；此输出不经过 `console-message` 事件或我们的日志管线，之前的过滤与 `disable-logging` 开关不足以完全屏蔽。
- 分类响应日志来源：`packages/main/node_modules/acfunlive-http-api/dist/services/LiveService.js:173` 的 `console.log('getLiveCategories API response:', ...)`；该打印是模块内部的调试输出，不带前缀，未被当前过滤命中。

## 方案
- 禁止自动打开 DevTools（开发模式也不自动打开）：
  - 修改主窗口 `WindowManager` 与插件窗口 `PluginWindowManager`：移除 `openDevTools` 自动调用；改为受 `ACFRAME_DEBUG_DEVTOOLS=1` 控制时才打开。
  - 在两处 `webContents.on('console-message')` 上新增过滤：
    - 来源 `sourceId` 包含 `devtools://devtools` → 直接忽略。
    - 消息包含 `Autofill.enable` 或 `Autofill.setAddresses` → 直接忽略。
- 扩展主进程 `console.*` 重写的过滤：
  - 若消息包含 `getLiveCategories API response:`，则抑制该 `console.log`；避免修改三方库源码，保持可维护性。

## 验证
- 重启后观察终端：不应再出现 DevTools Autofill 相关 ERROR 行。
- 调用 `/api/acfun/live/categories`：不再打印完整响应；功能不受影响（响应仍返回到前端）。

## 注意
- 不保留回退代码；统一以开关替代自动打开 DevTools，避免冗余。
- 不改动三方库源代码，采用主进程过滤以降低维护成本；后续若库升级携带调试输出仍能被过滤。