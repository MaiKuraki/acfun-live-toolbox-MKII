## 目标
- 使 `/api/plugins/:pluginId/config` 直接读取 Electron `userData/config.json` 的真实配置，保证即使主进程尚未完成持久化对象初始化也能返回有效配置。
- 若文件缺失或解析失败，则回退到 `ConfigManager.get('plugins.${id}.config')`。

## 修改点
- 文件：`packages/main/src/server/ApiServer.ts`
- 路由：`GET /api/plugins/:pluginId/config`
- 实现：
  1) 使用 `app.getPath('userData')` 拼接 `config.json` 路径，`fs.readFileSync` 读取并 `JSON.parse`
  2) 取值 `((json.plugins || {})[pluginId] || {}).config || {}`
  3) 若读取失败或值不是对象，则回退到 `new ConfigManager().get('plugins.${pluginId}.config', {})`
  4) 返回 `{ success: true, data: conf }`；异常时返回 `{ success: false, error }`
- 需要导入：`import { app } from 'electron'`（若未导入）；`fs`/`path` 在当前文件已存在引用，如无则补充导入。

## 验证
- 在没有初始化 ConfigManager 的早期阶段，接口仍能返回 `plugins.obs-assistant.config` 的真实内容。
- 常规情况下读取文件成功；文件缺失或解析错误时回退到 ConfigManager 保证稳定性。