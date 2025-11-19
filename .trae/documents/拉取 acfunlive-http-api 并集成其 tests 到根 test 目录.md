## 目标
- 从已安装的 `acfunlive-http-api` 中获取上游 `test/` 用例，并规范化到本仓库根目录的 `test/` 下。
- 保持用例依赖真实请求与真实函数，不引入任何 mock。
- 不启动或运行测试，仅完成拉取与适配，使后续可进行静态走查与 typecheck。

## 现状发现
- 依赖声明：`packages/main/package.json` 指向 `acfunlive-http-api`（GitHub 源）：`github:ACFUN-FOSS/acfundanmu.js#main`。
- 已安装包内含测试：`packages/main/node_modules/acfunlive-http-api/test/`，包含：
  - `LiveService.getLiveStatistics.test.ts`
  - `LiveService.startLiveStream.base64.test.ts`
- 本仓库已有根 `test/` 目录（若干现有 JS 用例），当前测试框架为 `vitest`（`packages/main/package.json` 中的脚本与依赖）。

## 实施步骤
1. 在根目录 `test/` 下新建子目录 `acfunlive-http-api/`，用于归档上游测试文件。
2. 将 `packages/main/node_modules/acfunlive-http-api/test/*.ts` 复制到 `test/acfunlive-http-api/`。
3. 适配导入路径与令牌文件路径：
   - 将测试文件中的 `import AcFunLiveApi from '../src/AcFunLiveApi'` 修改为 `import AcFunLiveApi from 'acfunlive-http-api'`（默认导出）。
   - 将 `path.resolve(process.cwd(), 'tests', 'token.json')` 修改为查找根 `test/token.json`：`path.resolve(process.cwd(), 'test', 'token.json')`。
4. 保持真实请求：不引入任何 mock；测试从环境变量 `ACFUN_TOKEN_INFO` 或 `AC_TOKEN_INFO` 读取令牌，若不存在则读取 `test/token.json`。
5. 不运行测试，仅保证文件位置与语法兼容 `vitest`（`describe`/`it`/`expect` 别名兼容）。
6. 在 `test/` 根新增占位说明（不创建文档文件）：仅确保目录下可放置 `token.json`（结构 `{ "token": "<生产环境令牌>" }`）。不提交令牌文件内容。
7. 清理无用内容：在复制的测试文件中只做必要的导入与路径修改，不保留任何冗余注释或兼容性回退代码。

## 变更内容预览（核心差异）
- `test/acfunlive-http-api/LiveService.getLiveStatistics.test.ts`
  - 旧：`import AcFunLiveApi from '../src/AcFunLiveApi'`
  - 新：`import AcFunLiveApi from 'acfunlive-http-api'`
  - 旧：`path.resolve(process.cwd(), 'tests', 'token.json')`
  - 新：`path.resolve(process.cwd(), 'test', 'token.json')`
- `test/acfunlive-http-api/LiveService.startLiveStream.base64.test.ts`
  - 旧：`import AcFunLiveApi from '../src/AcFunLiveApi'`
  - 新：`import AcFunLiveApi from 'acfunlive-http-api'`
  - 旧：`path.resolve(process.cwd(), 'tests', 'th[4].jpg')`
  - 新：`path.resolve(process.cwd(), 'test', 'th[4].jpg')`（若不存在则使用内置 base64 占位图）

## 验证方式（不执行，仅说明）
- 静态走查：确认 `test/acfunlive-http-api/*.ts` 语法与导入路径正确。
- 类型检查：可使用工作区已有脚本进行类型检查（例如 `pnpm -C packages/main run typecheck`），但本次不实际执行。

## 后续维护
- 在完成集成后，更新 `change` 目录下对应 `tasks.md` 的完成状态框（若存在）。
- 会话要点将在确认执行后写入内部记忆记录。