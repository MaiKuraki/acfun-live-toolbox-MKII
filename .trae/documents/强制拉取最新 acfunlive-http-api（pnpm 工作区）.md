## 操作说明
- 依赖位置：`packages/main/package.json` 声明 `acfunlive-http-api: github:ACFUN-FOSS/acfundanmu.js#main`（Git 依赖）
- 目标：强制从远端获取最新提交，刷新锁与本地 node_modules；只使用 pnpm，并遵守以 `;` 连接多条命令的约定

## 执行步骤（在仓库根目录）
1) 清理并重新安装目标依赖（确保 Git 源重新拉取）
- 命令：
  - `pnpm -F @app/main remove acfunlive-http-api ; pnpm -F @app/main add acfunlive-http-api@github:ACFUN-FOSS/acfundanmu.js#main`
2) 安装并刷新工作区依赖
- 命令：
  - `pnpm install --no-frozen-lockfile`
3) 类型检查与编译验证（不运行测试、不启动服务）
- 命令：
  - `pnpm -F @app/main run typecheck ; pnpm -F @app/main run build`

## 验证要点
- 依赖路径：`packages/main/node_modules/acfunlive-http-api/dist/` 的 d.ts、js 文件更新时间接近当前执行时间
- 关键 API 变更：`LiveService.d.ts` 中字段（如 `subCategoryName` 等）与远端一致
- 主进程编译通过，不引入 breaking change；无需改渲染层

## 说明
- 如需更强刷新（跨工作区），可追加：`pnpm store prune ; pnpm install --no-frozen-lockfile`，但一般不必