# `kind=message` 使用场景分析

## 总结

经过代码分析，`kind=message` 目前用于以下场景：

1. **插件间通信**（应该改为 `pluginMessage`）
2. **Overlay 消息**（UI/Window → Overlay，应该保留 `message` 或改为 `overlayMessage`）
3. **默认值/回退值**（当没有指定 kind 时的默认值）
4. **通用订阅的默认 kinds**（`subscribeEvents` 的默认值）
5. **系统级别的消息限制**（DataManager 中的限制）

## 详细分析

### 1. 插件间通信（应改为 `pluginMessage`）

#### 1.1 `PluginManager.handlePluginMessage`
- **位置**: `packages/main/src/plugins/PluginManager.ts:1383`
- **用途**: 发送插件间消息
- **当前**: `meta: { kind: 'message' }`
- **建议**: 改为 `meta: { kind: 'pluginMessage' }`

#### 1.2 `ApiBridge.sendRender`
- **位置**: `packages/main/src/plugins/ApiBridge.ts:396`
- **用途**: 从 main 插件发送消息到 renderer
- **当前**: `meta: { kind: 'message' }`
- **建议**: 改为 `meta: { kind: 'pluginMessage' }`（如果这是插件间通信）

#### 1.3 `/api/plugins/:pluginId/messages` 路由
- **位置**: `packages/main/src/server/routes/plugins.ts:195, 234`
- **用途**: 插件间消息路由（main ↔ window/ui）
- **当前**: `kind: "message"`
- **建议**: 改为 `kind: "pluginMessage"`

#### 1.4 Worker 插件订阅 `onMessage`
- **位置**: `packages/main/src/plugins/worker/api/subscribe.js:126-127`
- **用途**: 订阅插件间消息
- **当前**: `['message']` 和 `kind === 'message'`
- **建议**: 改为 `['pluginMessage']` 和 `kind === 'pluginMessage'`

#### 1.5 Renderer 插件订阅 `onMessage`
- **位置**: `packages/renderer/src/utils/plugin-injection.ts:929-930`
- **用途**: 订阅插件间消息
- **当前**: `["message"]` 和 `kind === "message"`
- **建议**: 改为 `["pluginMessage"]` 和 `kind === "pluginMessage"`

#### 1.6 Worker 消息处理
- **位置**: `packages/main/src/plugins/worker/plugin-worker.js:316, 329`
- **用途**: 处理来自 ProcessManager 的消息
- **当前**: `message.type === 'message'` 和 `handleMessage('message', payload)`
- **建议**: 可能需要更新，但这个是内部协议，可能不需要改

### 2. Overlay 消息（应保留 `message` 或改为 `overlayMessage`）

#### 2.1 `publishOverlayMessage`
- **位置**: `packages/main/src/server/routes/sse.ts:294`
- **用途**: 发布 overlay 消息（UI/Window → Overlay）
- **当前**: `meta: { kind: "message" }`
- **建议**: 保留 `message` 或改为 `overlayMessage`（因为这是 UI/Window 向 Overlay 发送的消息，不是插件间通信）

#### 2.2 `/api/plugins/:pluginId/overlay/messages` 路由
- **位置**: `packages/main/src/server/routes/sse.ts:399`
- **用途**: 发送消息到 overlay
- **当前**: `kind: "message"`
- **建议**: 保留 `message` 或改为 `overlayMessage`

**注意**: Overlay 消息和插件间消息是不同的场景：
- **插件间消息**: 一个插件的 main ↔ window/ui 之间的通信
- **Overlay 消息**: UI/Window → Overlay 的单向通信

### 3. 默认值/回退值（需要评估）

#### 3.1 SSE 路由中的默认值
- **位置**: `packages/main/src/server/routes/sse.ts:132, 144, 241, 248`
- **用途**: 当没有指定 kind 时的默认值
- **当前**: `kind ?? "message"` 或 `kind || "message"`
- **建议**: 保留作为回退值，或者改为更明确的默认值（如 `"unknown"`）

#### 3.2 SSE Manager 中的默认值
- **位置**: `packages/main/src/plugins/worker/api/sseManager.js:70`
- **用途**: 解析 SSE 事件时的默认值
- **当前**: `env.kind || ev.type || 'message'`
- **建议**: 保留作为回退值

#### 3.3 Plugin Injection 中的默认值
- **位置**: `packages/renderer/src/utils/plugin-injection.ts:292`
- **用途**: 解析 SSE 事件时的默认值
- **当前**: `(env as any).kind || e.type || "message"`
- **建议**: 保留作为回退值

### 4. 通用订阅的默认 kinds（需要评估）

#### 4.1 Worker `subscribeEvents`
- **位置**: `packages/main/src/plugins/worker/api/subscribe.js:6`
- **用途**: 通用事件订阅的默认 kinds
- **当前**: `['message', 'action']`
- **建议**: 可能需要保留，因为这是通用订阅，可能包含多种消息类型

#### 4.2 Renderer `subscribeEvents`
- **位置**: `packages/renderer/src/utils/plugin-injection.ts:896`
- **用途**: 通用事件订阅的默认 kinds
- **当前**: `["message", "action"]`
- **建议**: 可能需要保留，因为这是通用订阅，可能包含多种消息类型

### 5. 系统级别的消息限制（需要保留）

#### 5.1 DataManager 消息数量限制
- **位置**: `packages/main/src/persistence/DataManager.ts:99`
- **用途**: 系统级别的消息数量限制
- **当前**: `if (kind === 'message' || kind === 'action' || kind === 'ui') return 500;`
- **建议**: 保留，但可能需要添加 `pluginMessage` 和 `overlayMessage` 的限制

### 6. 类型定义（需要更新）

#### 6.1 全局类型定义
- **位置**: `types/global.d.ts:47`
- **用途**: PluginOverlaySseEnvelope 的 kind 类型
- **当前**: `| "message"`
- **建议**: 添加 `| "pluginMessage"` 和 `| "overlayMessage"`（如果需要）

#### 6.2 SSE 路由类型定义
- **位置**: `packages/main/src/server/routes/sse.ts:19`
- **用途**: PluginOverlaySseEnvelope 的 kind 类型
- **当前**: `| "message"`
- **建议**: 添加 `| "pluginMessage"` 和 `| "overlayMessage"`（如果需要）

## 建议

### 方案 A：完全废除 `message`，使用更具体的 kinds

1. **插件间消息** → `pluginMessage`
2. **Overlay 消息** → `overlayMessage`
3. **默认值** → 改为 `"unknown"` 或保留 `"message"` 作为通用回退
4. **通用订阅** → 明确指定需要的 kinds，不再使用 `message` 作为默认

**优点**:
- 语义更清晰
- 避免混淆
- 更好的类型安全

**缺点**:
- 需要大量修改
- 可能影响现有插件

### 方案 B：保留 `message` 用于 Overlay，插件间使用 `pluginMessage`

1. **插件间消息** → `pluginMessage`
2. **Overlay 消息** → 保留 `message`
3. **默认值** → 保留 `message` 作为回退
4. **通用订阅** → 保留 `message` 在默认 kinds 中

**优点**:
- 向后兼容性更好
- 修改量较小
- Overlay 消息保持现有语义

**缺点**:
- `message` 仍然有歧义（是 Overlay 消息还是通用消息？）

### 方案 C：保留 `message` 作为通用消息，添加 `pluginMessage` 用于插件间通信

1. **插件间消息** → `pluginMessage`
2. **Overlay 消息** → 保留 `message`
3. **默认值** → 保留 `message` 作为回退
4. **通用订阅** → 保留 `message` 在默认 kinds 中

**优点**:
- 最小化修改
- 保持向后兼容
- `message` 作为通用消息类型仍然可用

**缺点**:
- `message` 的语义仍然不够明确

## 推荐方案

**推荐方案 B**：保留 `message` 用于 Overlay 消息，插件间通信使用 `pluginMessage`。

理由：
1. Overlay 消息是一个明确的场景（UI/Window → Overlay），使用 `message` 是合理的
2. 插件间通信使用 `pluginMessage` 可以避免与 Overlay 消息混淆
3. 向后兼容性更好，现有代码不需要大量修改
4. 语义相对清晰：`message` = Overlay 消息，`pluginMessage` = 插件间消息

## 需要修改的文件清单

### 必须修改（插件间通信改为 `pluginMessage`）

1. `packages/main/src/plugins/PluginManager.ts` - `handlePluginMessage`
2. `packages/main/src/plugins/ApiBridge.ts` - `sendRender`（如果用于插件间通信）
3. `packages/main/src/server/routes/plugins.ts` - `/api/plugins/:pluginId/messages` 路由
4. `packages/main/src/plugins/worker/api/subscribe.js` - `onMessage` 订阅
5. `packages/renderer/src/utils/plugin-injection.ts` - `onMessage` 订阅

### 可选修改（Overlay 消息可以保留 `message` 或改为 `overlayMessage`）

6. `packages/main/src/server/routes/sse.ts` - `publishOverlayMessage` 和 `/api/plugins/:pluginId/overlay/messages`

### 类型定义更新

7. `types/global.d.ts` - 添加 `pluginMessage` 类型
8. `packages/main/src/server/routes/sse.ts` - 添加 `pluginMessage` 类型
9. `packages/renderer/src/utils/plugin-injection.ts` - 添加 `pluginMessage` 类型

### 系统限制更新

10. `packages/main/src/persistence/DataManager.ts` - 添加 `pluginMessage` 的限制

