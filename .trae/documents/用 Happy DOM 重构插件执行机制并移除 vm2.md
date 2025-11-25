## 约束更新

* 移除并禁止使用 `runtime.mocks` 与 `runtime.injectWs`。

* 插件在 `manifest.json` 声明“根目录依赖文件路径列表”，以脚本标签顺序加载；所有依赖加载完成并触发 `load` 后，再以脚本标签引入主入口 `index.js`。

* 插件统一使用 CommonJS（`module.exports`/`require`）。

## 现状触点（待改）

* vm2 使用：`packages/main/src/plugins/PluginLifecycle.ts:2`、`packages/main/src/plugins/PluginLifecycle.ts:183-190`；`packages/main/src/plugins/worker/plugin-worker.js:14`、`packages/main/src/plugins/worker/plugin-worker.js:119-124`。

* 沙箱配置：`packages/main/src/plugins/ProcessManager.ts:138-159`（需删除 mocks/injectWs 字段）。

* Worker 启动：`packages/main/src/plugins/WorkerPoolManager.ts:96-101`（保留路径选择与线程管理）。

## 新执行模型（Happy DOM + 脚本注入）

* 线程隔离：保留 `worker_threads`；保留内存/超时监控与空闲清理。

* DOM 环境初始化（每个插件 Worker）：

  * `const { Window } = require('happy-dom'); const dom = new Window();`

  * 注入浏览器 API：`global.window = dom; global.document = dom.document; global.navigator = dom.navigator; global.fetch = dom.fetch.bind(dom); global.localStorage = dom.localStorage; global.sessionStorage = dom.sessionStorage;`

* 移除CommonJS 支持：

* 依赖脚本加载（按清单顺序）：

  * Manifest 新增字段（示例）：

    ```json
    {
      "id": "obs-assistant",
      "main": "index.js",
      "libs": [
        "./obs-websocket-js.js",
        "./vendor/some-lib.js"
      ]
    }
    ```

  * 在 Worker 中按顺序读取每个脚本文件内容：

    * 为每个依赖创建 `<script>` 元素（`const s = document.createElement('script'); s.textContent = code; document.head.appendChild(s);`）触发 Happy DOM 的脚本执行（内联脚本）。

    * 依次执行，确保依赖链按声明顺序生效。

  * 依赖全部执行后，模拟 `window` 的 `load` 事件：`window.dispatchEvent(new dom.Event('load'));`

  * 再以同样方式创建 `<script>` 注入并执行 `main`（`index.js`）。

* 生命周期钩子：

  * `PluginLifecycle.ts` 移除 `VM` 沙箱执行；主进程不直接执行插件自定义函数。

  * 插件侧如需参与生命周期，按规范名称编写生命周期函数。\
    由主进程通过 `window.[生命周期函数名] `调用。

## 代码改动点

* 删除 `vm2` 依赖与所有引用：详见上述文件位置。

* `packages/main/src/plugins/worker/plugin-worker.js`：重写为 Happy DOM + 脚本注入模式；保持日志/内存/消息协议。

* `packages/main/src/plugins/ProcessManager.ts:138-159`：删除 `mocks/injectWs` 字段，新增解析 `manifest.libs`与 `manifest.main` 并传入 Worker。

* `packages/main/src/plugins/PluginLifecycle.ts:183-190`：移除 `VM`；改为仅执行核心内置钩子函数；插件钩子改走 Worker 方法形式。

## 清单校验与解析

* 更新 `PluginManager.validatePluginManifest`：

  * 新增 `:ibs string[]` 校验（必须为插件根目录相对路径）。

  * `main: string` 必填（CommonJS 入口）。

  * 移除/忽略 `runtime.mocks` 与 `runtime.injectWs`。

