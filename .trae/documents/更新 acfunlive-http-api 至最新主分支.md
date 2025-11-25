## 目标
- 拉取并应用 `acfunlive-http-api` 最新 `main` 分支到工作区的所有使用方（主进程与渲染端）。

## 现状调查
- 依赖声明：
  - `packages/main/package.json:20` 使用 `"acfunlive-http-api": "github:ACFUN-FOSS/acfundanmu.js#main"`
  - `packages/renderer/package.json:25` 使用 `"acfunlive-http-api": "github:ACFUN-FOSS/acfundanmu.js#main"`
- 已安装位置与类型声明：
  - 包目录：`packages/main/node_modules/acfunlive-http-api`（版本字段为 `1.0.0`）
  - 类型声明：`packages/main/node_modules/acfunlive-http-api/dist/index.d.ts`
  - 内部服务路径存在：`dist/services/*`、`dist/core/HttpClient.*`
- 代码使用面（供升级风险评估）：
  - 主进程：`TokenManager.ts`、`AcfunAdapter.ts`、`AcfunApiProxy.ts` 等直接使用 `auth/live/danmu/gift/manager/badge/user/replay/livePreview` 能力及 `dist/services` 与 `core/HttpClient`。
  - 渲染端：仅做 `import type` 的类型引用（不涉及运行时导入）。

## 更新步骤（执行命令均使用 pnpm）
1) 在工作区根目录执行递归更新，拉取 GitHub `main` 最新提交：
- `pnpm up -r acfunlive-http-api@github:ACFUN-FOSS/acfundanmu.js#main`
  - 或按包定向更新：
  - `pnpm -C packages/main up acfunlive-http-api@github:ACFUN-FOSS/acfundanmu.js#main ; pnpm -C packages/renderer up acfunlive-http-api@github:ACFUN-FOSS/acfundanmu.js#main`

2) 安装与锁定：
- `pnpm install`
- 如需进一步统一版本树：`pnpm dedupe`

## 验证步骤（不创建/运行测试，仅构建与类型检查）
- 主进程构建与类型检查：
  - `pnpm -C packages/main build ; pnpm -C packages/main typecheck`
- 渲染端构建与类型检查：
  - `pnpm -C packages/renderer build ; pnpm -C packages/renderer typecheck`
- 重点自检：
  - 编译期检查 `AcfunApiProxy.ts:4-6` 的 `dist/services/*` 与 `dist/core/HttpClient` 是否仍存在且类型匹配。
  - 运行期（可选）做最小烟测：调用 `qrLogin/checkQrLoginStatus`、`danmu.start/stop`、`live.getLiveStreamStatus` 路由，确认返回结构未破坏。

## 兼容与清理
- 如升级引入 API 变更：
  - 统一在 `TokenManager.ts:5` 与 `AcfunAdapter.ts:2` 一处修正类型与方法签名，避免分散改动。
  - 移除任何为旧版本保留的回退代码（遵守“严禁为兼容旧版本保留回退代码”）。

## 注意事项
- 仅使用 `pnpm` 执行安装/更新；多条命令用 `;` 连接。
- 按用户规则，不主动创建/运行测试；如需完整测试流再另行授权。

## 完成标准
- 两侧包均锁定到 `acfunlive-http-api` 最新 `main` 提交。
- 构建与类型检查通过，无编译错误；关键路径（`dist/services`、`core/HttpClient`）存在并可用。