## 目标
- 将所有用户可见的“AcFun 直播工具箱 MKII/AcFun 直播工具箱”等中文品牌字样统一替换为“ACFUN直播框架”。
- 将英文品牌“AcFun Live Toolbox MKII/AcFun Live Toolbox”等统一替换为“ACLiveFrame”。
- 保持服务名/库名/域名不变（如 `acfunlive-http-api`、`live.acfun.cn`）。

## 范围与不变更项
- 变更范围：UI 展示文本、文档标题与正文、托盘提示文字、README/openspec 文档中的品牌描述。
- 不变更：依赖与包名（`acfunlive-http-api`）、API/域名（`live.acfun.cn`）、技术名词、路径与类型名（如 `AcFunLiveApi` 若为代码标识而非文档品牌）。

## 替换映射
- 中文：
  - `AcFun 直播工具箱 MKII`、`AcFun 直播工具箱`、`AcFun 直播工具框架` → `ACFUN直播框架`
- 英文：
  - `AcFun Live Toolbox MKII`、`AcFun Live Toolbox` → `ACLiveFrame`

## 主要受影响文件（示例位置）
- 渲染层：
  - `packages/renderer/src/pages/Settings.vue:141` `<h3 class="app-name">AcFun 直播工具箱 MKII</h3>` → 改为 `ACFUN直播框架`
  - `packages/renderer/src/pages/Settings.vue:152` 描述中含“AcFun 直播工具框架” → 改为 `ACFUN直播框架`
- 主进程：
  - `packages/main/src/bootstrap/TrayManager.ts:28` `this.tray.setToolTip('AcFun 直播工具箱')` → 改为 `ACFUN直播框架`
- 文档与说明：
  - `openspec/project.md:4` `ACFun Live Toolbox MKII is ...` → 改为 `ACLiveFrame is ...`
  - `docs/plugin-development.md` 标题与多处正文中的 `AcFun Live Toolbox` → 改为 `ACLiveFrame`
  - `docs/api-reference.md` 标题与正文中的 `AcFun Live Toolbox` → 改为 `ACLiveFrame`
  - `docs/integration-guide.md` 多处 `AcFun Live Toolbox` → 改为 `ACLiveFrame`（保留 `acfunlive-http-api` 不变）
  - `packages/main/docs/*` 多处 `AcFun Live Toolbox MKII` → 改为 `ACLiveFrame`
  - `README.md` 中英文描述里出现的 `AcFun Live Toolbox` → 改为 `ACLiveFrame`（保留库名不变）

## 实施步骤
1. 批量替换渲染层与主进程的品牌展示文本（仅 UI/提示，不改代码标识）。
2. 批量替换文档集与 openspec 的标题和正文中的品牌字样，统一为“ACFUN直播框架/ACLiveFrame”。
3. 保留并核对所有 `acfunlive-http-api`、`live.acfun.cn`、`AcFunLiveApi` 等技术与依赖名，确保未被误改。
4. 清理被触及文件中的冗余注释或无用代码段（遵循项目规则）。

## 验证
- 静态检视：全库搜索确认旧品牌字样已清零，仅保留依赖/域名/技术名相关词条。
- 类型检查：执行类型检查确保替换未引入编译错误（不运行测试或开发服务器）。

## 交付与记录
- 更新 `change` 目录下相关 `tasks.md` 完成状态。
- 会话结束后，将要点总结至记忆库（不改代码，仅记录变更摘要）。

## 风险控制
- 防止误改依赖与域名，替换脚本按映射与白名单执行。
- 文档中的 API/库提及保持原名，避免误导或破坏引用。

请确认以上计划，确认后我将按步骤执行并提交修改。