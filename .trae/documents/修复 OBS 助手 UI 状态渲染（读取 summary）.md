**问题原因**

* UI 通过总线请求 `process.execute(method:'getStatus')`，宿主回传的数据结构为整条执行结果对象，其中状态位位于 `data.summary`。

* 当前 `ui.html` 的 `renderStatus` 直接从 `data.connected/data.running` 读取，未解包 `summary`，导致 `running:true` 等信息被忽略，呈现为“未连接（未运行或插件忙）”或“未连接（未运行）”。

* 代码位置：

  * 宿主桥接：`packages/renderer/src/pages/PluginFramePage.vue:238-246` 将执行结果原样置于 `bridge-response.data`

  * UI 渲染：`buildResources/plugins/obs-assistant/ui.html:55` 误读顶层字段而非 `summary`。

**修复方案**

* 修改 `renderStatus` 将状态源统一解包为 `const s = data?.summary ?? data ?? {}`，随后从 `s.connected/s.running/s.lastError/s.lastAttempt` 获取字段。

* 可选优化：当 `s.connecting===true` 时，将连接文案显示为“连接中”，以提升可读性。

* 不改动其它桥接/重试逻辑，保持现有总线与超时重试策略。

**修改要点（仅说明）**

* `buildResources/plugins/obs-assistant/ui.html`：

  * 将

    * `var conn = !!(data && data.connected);`

    * `var run = !!(data && data.running);`

    * `var err = (data && data.lastError) ? String(data.lastError) : '';`

    * `var attempt = (data && data.lastAttempt) ? String(data.lastAttempt) : '';`

  * 统一改为解包 `summary` 后读取：

    * `var s = (data && data.summary) ? data.summary : (data || {});`

    * `var conn = !!s.connected; var run = !!s.running;`

    * `var err = s.lastError ? String(s.lastError) : '';`

    * `var attempt = s.lastAttempt ? String(s.lastAttempt) : '';`

  * 可选：`if (s.connecting) { connText = '连接中'; }`

**验证计划**

* 启动应用并打开插件页面，保持 OBS 运行但未建立 WebSocket：期望显示“未连接（运行中）”。

* 建立 WebSocket 连接后再次触发 `refresh()`：期望显示“已连接（运行中）”。

* 人为制造超时或总线不可用：仍显示“未连接（未运行或插件忙）”的兜底文案。

**回归检查**

* 观察总线日志，确认 `bridge-response.data.summary` 被正确解包与渲染。

* 无其它文件改动；保持现有 `requestWithRetry` 的重试条件与时序。

