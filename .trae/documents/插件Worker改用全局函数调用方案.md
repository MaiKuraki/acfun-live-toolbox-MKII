# 目标
- 移除插件导出对象探测与依赖加载逻辑，改为调用约定的全局函数。

# 修改点
- 删除 plugin 变量及导出探测逻辑（window.plugin/Plugin/default/exports/module.exports）。
- 删除 safeRequire、runCjs、injectLibScript、manifest.libs 读取与加载。
- 将主入口 index.js 以 <script> 注入到 document.body。
- 增加统一的全局函数调用封装：
  - beforeLoaded：Happy DOM 初始化后、注入 index.js 之前调用。
  - 注入 index.js 后，触发 window.load 事件。
  - afterLoaded：完成注入和 window.load 后调用。
  - 执行消息：优先调用 windowRef.handleMessage(type, payload)，否则尝试 windowRef[method](...args)。
  - 退出清理：调用 windowRef.cleanup()（存在时）。
- 所有调用使用 try/catch 包裹并打印调用错误信息。

# 执行流程
1. 初始化 Happy DOM（window、document、storage、console 转发）。
2. try{ windowRef.beforeLoaded() }catch(e){ console.error(e) }。
3. 读取并将 index.js 代码注入到 document.body。
4. 触发 window.load 事件。
5. try{ windowRef.afterLoaded() }catch(e){ console.error(e) }。
6. 收到 execute 消息时：
   - 若存在 windowRef.handleMessage，则调用 handleMessage(type, payload)。
   - 否则调用 windowRef[method](...args)。
   - 异常捕获并返回错误信息；成功时返回序列化结果。
7. 进程退出时调用 windowRef.cleanup()（存在时）。

# 验证计划
- 生成 Electron UI 测试用例：验证 beforeLoaded/afterLoaded/handleMessage/cleanup 被正确调用与日志输出。
- 构建与自动修复后执行测试，确保消息流与错误处理正常。

# 兼容性与约束
- 不保留旧版导出对象路径，严格按约定的全局函数工作。
- 插件需自行在 index.js 中定义上述全局函数，否则按回退行为记录警告并返回默认结果。