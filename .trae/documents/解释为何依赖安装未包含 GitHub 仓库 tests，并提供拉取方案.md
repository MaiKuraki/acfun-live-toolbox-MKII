## 原因说明
- 在 `packages/main/package.json:20` 以 `github:ACFUN-FOSS/acfundanmu.js#main` 方式安装包时，实际安装内容遵循 npm 的打包规则（等价于 `npm pack`）：只包含发布配置允许的文件。
- 维护者通常通过 `package.json` 的 `files` 白名单或 `.npmignore` 排除开发资产（如完整 `tests/`、示例、脚手架等），以减小包体积和避免把内部测试带到消费者环境。
- 因此，安装到 `node_modules` 的并不是完整仓库，而是“发布包”。发布包里可能仅保留少量示例测试（如当前看到的 `test/` 目录下两条用例），而不是 GitHub 仓库的完整 `tests/`。

## 可选方案
1. 直接拉取 GitHub 仓库的 `tests/` 到本仓库根 `test/acfunlive-http-api/`
   - 复制 `.ts` 测试文件到根 `test/`（符合项目“所有测试文件必须在根 test”的规则）。
   - 统一导入为 `import AcFunLiveApi from 'acfunlive-http-api'`，不引用内部源码路径。
   - 将令牌与图片路径改为根 `test/token.json`、`test/th[4].jpg`，不引入任何 mock。
   - 不运行测试，仅保证静态走查与 typecheck 可通过。
2. 维持现状，仅使用发布包中随附的示例测试。
   - 不推荐：与“拉取完整 tests 以便静态走查”的目标不符。

## 执行计划（选择方案1）
- 读取远端仓库的 `tests/` 文件列表，筛选有效 `.ts` 测试。
- 将其复制到 `test/acfunlive-http-api/`，并适配导入与路径。
- 保持无 mock、无需启动或运行测试；完成后进行一次类型检查（仅说明，不执行）。
- 如有 `change/tasks.md`，更新对应完成状态；并将要点写入 memory 记录。