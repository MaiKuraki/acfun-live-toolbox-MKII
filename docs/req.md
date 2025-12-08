# 插件系统 API 需求规划

## 注入方案与访问控制 (Injection Scheme & Access Control)

### 注入机制
为了统一开发体验，消除开发者手动调用的复杂性，系统采用以下注入方案：

1.  **UI / Window 插件**:
    *   **机制**: 使用 **Wujie** 微前端框架加载。
    *   **注入**: 在内容初始化（`setupApp` 或 `props`）后，直接将 API 对象注入到子应用环境（如 `window.toolboxApi`）。
    *   **时机**: 页面加载完成前即就绪。

2.  **Overlay 插件**:
    *   **机制**: 使用 **静态模板包装器 (Overlay Wrapper)** 挂载。
        *   *注：Overlay 运行于 OBS 浏览器源或普通浏览器中，无 Node 环境。当前实现为静态 HTML 包装器，通过 iframe 加载插件内容，并模拟 Wujie 的 props 注入方式。*
    *   **注入**: 包装器在 iframe 加载后，将 API 对象注入到 iframe 的 `contentWindow` 中（同源策略下），或通过 `postMessage` 桥接。
    *   **时机**: iframe `load` 事件后。

3.  **Main 插件**:
    *   **机制**: 运行于主进程（Node.js 环境）。
    *   **注入**: 在插件初始化之前，将 API 函数逐个挂载到插件的全局上下文（`global` 或插件实例 `this`）之上。
    *   **时机**: 插件脚本执行前。

4.  **开发支持**: 提供统一的 `d.ts` 声明文件，涵盖所有注入接口。

### 访问控制原则
为保障安全与稳定性，API 对不同类型的插件（`[Main]`, `[UI]`, `[Window]`, `[Overlay]`）实施严格的访问控制：


1.  **全局**: 严禁暴露直播推流/关播等核心控制接口。
2.  **Window 控制**: 仅 `[Window]` 类型可用，且仅能控制自身窗口。
3.  **Window 事件订阅**: 仅能订阅主窗口及插件自身窗口的事件。

---

## 1. AcFun 接口 (AcFun API)
目前最为完善，主要通过 `ApiBridge.acfun` 暴露。

### 用户相关 `acfun.user`
*支持 `[Main]`, `[UI]`, `[Window]`, `[Overlay]`*
- `getUserInfo(userId)`: 获取用户信息 `[ALL]`

### 弹幕与房间 `acfun.danmu` / `acfun.live`
*支持 `[Main]`, `[UI]`, `[Window]`, `[Overlay]`*
- `getLiveRoomInfo(liverUID)`: 获取直播间详情 `[All]`
- `sendComment(liverUID, content)`: **[已实现]** 发送弹幕 `[Main, UI, Window]` (需用户交互)

### 直播控制 `acfun.live`
- `startLiveStream(...)`: 开播 `[ALL]`
- `stopLiveStream(liveId)`: 关播 `[ALL]`
- `updateLiveRoom(...)`: 更新封面/标题 `[ALL]`
- `getLiveStreamStatus()`: 获取直播状态 `[All]` (状态查询允许)
- `checkLivePermission()`: 检查开播权限 `[ALL]`
- `getLiveList(page, pageSize)`: **[已实现]** 获取直播列表（不仅是热门） `[All]`
- `getLiveStatisticsByDays(days)`: **[已实现]** 获取多天直播统计数据 `[ALL]`

### 直播互动 `acfun.gift` / `acfun.manager` / `acfun.badge`
*主要用于 `[Main]`, `[UI]`, `[Window]`*
- `getAllGiftList()` / `getLiveGiftList()`: 获取礼物列表 `[All]`
- `addManager()` / `deleteManager()`: 房管管理 `[ALL]`
- `authorKick()` / `managerKick()`: 踢人 `[ALL]`


## 2. 主进程二次封装接口 (Secondary Encapsulation)

主进程在 AcFun API 基础上，针对工具箱业务需求进行了深度封装，提供了更高级的数据管理和业务逻辑能力。这些接口目前部分通过 `ApiBridge` 暴露，部分需要规划暴露。

### 2.1 房间管理与状态 (Room Management)
`RoomManager` 管理着多直播间的连接生命周期。插件应能感知房间状态变化。

- `subscribeEvents(callback, filter)`: **[核心][现有]** `[All]`
  - 监听标准化事件（`NormalizedEvent`），这是主进程将 AcFun 原始弹幕消息（Protobuf/WebSocket）转化为统一格式后的数据流。
  - 支持按 `room_id`, `type` (danmaku, gift, like, enter, follow), `user_id` 过滤。
  - 支持自定义过滤器和速率限制。
- `getRoomStatus(roomId)`: **[已实现]** 获取指定房间的连接状态（Connecting, Connected, Closed 等）及元数据（LiveId, StreamInfo）。 `[All]`
- `getAllRooms()`: **[已实现]** 获取当前所有受管房间的列表及状态。 `[All]`

### 2.2 数据持久化与查询 (Persistence & Query)
主进程内置 SQLite 数据库（`DatabaseManager` / `DanmuSQLiteWriter`），自动存储所有直播间收到的弹幕和礼物数据。

- `pluginStorage.write(table, row)`: **[现有]** `[All]`
  - 插件专属的轻量级 KV/Row 存储。
  - 自动为每个插件隔离表名（`plugin_{pluginId}_{table}`）。
- `queryEvents(query)`: **[已实现]** `[ALL]`
  - 暴露 `QueryService` 的能力，允许插件查询历史弹幕数据。
  - 支持复杂条件：时间范围、用户ID/昵称、关键词搜索、礼物价值筛选等。
  - 场景：弹幕分析插件、历史回顾插件。



## 3. Electron 进程控制与监听 (Window/Overlay Control)
目前缺乏插件对自己窗口的控制能力，属于 **重点规划** 内容。

### 窗口状态控制 `window.*` [已实现]
*仅限 `[Window]` 类型，且仅能控制自身 (根据原则 3)*
- `minimize()`: 最小化 `[Window]`
- `maximize()`: 最大化 `[Window]`
- `restore()`: 还原 `[Window]`
- `close()`: 关闭（隐藏或销毁） `[Window]`
- `show()` / `hide()`: 显示/隐藏 `[Window]`
- `focus()` / `blur()`: 聚焦/失焦 `[Window]`

### 窗口属性设置 `window.*` [已实现]
*仅限 `[Window]` 类型，且仅能控制自身*
- `setSize(width, height)`: 设置尺寸 `[Window]`
- `getSize()`: 获取尺寸 `[Window]`
- `setPosition(x, y)`: 设置位置 `[Window]`
- `getPosition()`: 获取位置 `[Window]`
- `setOpacity(opacity)`: 设置透明度 (0.0 - 1.0) `[Window]`
- `setAlwaysOnTop(flag)`: 置顶/取消置顶 `[Window]`
- `setResizable(flag)`: 是否可调整大小 `[Window]`

### 交互穿透（Overlay 核心） `window.*` [已实现]
*仅限 `[Window]` (Overlay 通常由宿主控制，但如果 Overlay 也是 Window 类型则可用)*
- `setIgnoreMouseEvents(ignore, options)`: 开启/关闭鼠标穿透（让鼠标操作直接穿过透明窗口点击到底下的游戏/桌面） `[Window]`

### 窗口事件监听 `window.on(...)` [已实现]
*仅能订阅主窗口及插件对应 Window 的事件 (根据原则 4)*
- `on('resize')`: 窗口大小改变 `[Main, Window,UI]`
- `on('move')`: 窗口移动 `[Main, Window,UI]`
- `on('focus')` / `on('blur')`: 聚焦状态改变 `[Main, Window,UI]`
- `on('maximize')` / `on('unmaximize')` `[Main, Window,UI]`

## 4. 渲染进程事件和生命周期 (Lifecycle)
已具备基础生命周期

### 生命周期钩子 `lifecycle.on(...)` [现有]
*支持 `[All]`*
- `afterLoaded`: main加载完成 `[All]`
- `beforeUnloaded`: main卸载前 `[All]`
- `beforeUiOpen` / `afterUiOpen`: UI 界面//window打开前后 `[MAIN、OVERLAY]`
- `beforeOverlayOpen` / `afterOverlayOpen`: 悬浮窗打开前后 `[MAIN、UI、WINDOW]`


## 5. 系统操作 (System Operations)
需大幅扩充以支持工具箱属性。

### 外部交互 `system.*`
*支持 `[Main, UI, Window]`*
- `openExternal(url)`: **[已实现]** 调用默认浏览器打开链接（现有 IPC 实现，需暴露给插件） `[Main, UI, Window]`
- `showItemInFolder(path)`: **[已实现]** 在资源管理器中显示文件 `[Main, UI, Window]`
- `openPath(path)`: **[已实现]** 打开文件或文件夹 `[Main, UI, Window]`

### 剪贴板 `clipboard.*` [已实现]
*支持 `[Main, UI, Window]`*
- `writeText(text)`: 写入文本（如复制弹幕内容） `[Main, UI, Window]`
- `readText()`: 读取文本 `[Main, UI, Window]`

### 通知与交互 `interaction.*` [已实现]
*支持 `[Main, UI, Window]`*
- `notify({ title, body, icon })`: 发送系统原生通知 `[Main, UI, Window]`
- `showOpenDialog(options)`: 打开文件选择框（导入配置等） `[Main, UI, Window]`
- `showSaveDialog(options)`: 打开保存文件框（导出数据等） `[Main, UI, Window]`

### 文件系统 `fs.*`
*支持 `[Main, UI, Window]`*
- `pluginStorage.write(table, row)`: **[现有]** 简单的结构化数据持久化 `[All]`
- `readFile(path)`: **[已实现]** 读取文件（需限制在插件沙箱或特定目录，保障安全） `[Main, UI, Window]`
- `writeFile(path, content)`: **[已实现]** 写入文件 `[Main, UI, Window]`

### 执行 `shell.*` [规划]
*仅限 `[Main]`*
- `exec(command)`: 执行外部 EXE 或脚本（**高危权限**，需严格的权限申请和用户授权机制） `[Main]`

## 6. 全局快捷键 (Global Shortcuts)
支持插件注册全局或应用内快捷键，实现快速操作。

### 快捷键管理 `shortcut.*` [已实现]
*支持 `[Main, UI, Window]`*
- `register(accelerator, callback)`: 注册快捷键 `[Main, UI, Window]`
  - `accelerator`: 快捷键组合字符串（如 "CommandOrControl+Shift+A"）
  - `callback`: 触发时的回调函数
  - 返回值: 是否注册成功（布尔值）
- `unregister(accelerator)`: 注销指定快捷键 `[Main, UI, Window]`
- `unregisterAll()`: 注销该插件所有快捷键 `[Main, UI, Window]`
- `isRegistered(accelerator)`: 检查快捷键是否已被注册 `[Main, UI, Window]`

### 事件监听 [规划]
- 当快捷键触发时，主进程通过 IPC 向对应插件的渲染进程发送事件，插件通过回调函数处理业务逻辑（如：快速开关弹幕、一键截图、静音等）。

## 7. 状态共享 (State Sharing)
系统提供了一套 **只读状态快照 (Read-Only Store Snapshot)** 机制，将主程序的关键状态（如用户信息、直播间连接状态、全局配置等）实时同步给所有插件。

### 机制原理
1.  **上报 (Reporter)**: 主程序渲染进程监听 Pinia Store 变更，脱敏后上报至主进程。
2.  **分发 (Broadcast)**: 主进程维护一份全局快照，并通过 SSE 将增量更新广播给所有活跃的插件（Main/UI/Window/Overlay）。
3.  **消费 (Consume)**:
    *   **所有类型**: 通过统一的 `toolboxApi.store` 接口获取快照或订阅变更。

### 接口定义 `store.*` [已实现]
*   `store.get(stores)`: **[已实现]** 获取指定 store 的最新快照。
    *   参数: `stores: string[]` (如 `['account', 'sidebar']`)。**支持通配符 `['*']` 获取所有 Store 数据（自动脱敏，不包含 token 等敏感字段）。**
    *   返回: `Promise<Record<string, any>>`
*   `store.onChange(stores, callback)`: **[已实现]** 监听指定 store 的变更。
    *   参数: `stores: string[]` (支持 `['*']` 监听所有非敏感变更), `callback: (data: any) => void`
    *   返回: `{ close: () => void }`

### 数据结构示例
    ```typescript
    interface ReadonlyStore {
      account: {
        userInfo: { userId: string; name: string; avatar: string };
        isLoggedIn: boolean;
      };
      sidebar: {
        connectedRooms: string[]; // 已连接的直播间 ID 列表
      };
      // 更多模块...
    }
    ```

## 8. 插件通信 (Plugin Communication)

为了支持插件各模块（Main, UI, Window, Overlay）之间的协同工作，系统提供了一套基于 IPC 和 SSE 的通信机制。

### 通信拓扑图

*   **Main ↔ UI**: 双向通信 `[Bidirectional]`
*   **Main ↔ Window**: 双向通信 `[Bidirectional]`
*   **Any (Main/UI/Window) → Overlay**: 单向广播 `[One-way]`
*   **Overlay → Any**: **禁止** (仅能上报基础生命周期与心跳)

### 8.1 Main ↔ UI / Window (双向强交互)
Main, UI, Window 均运行在受信任或托管环境中，支持复杂的双向交互。为了减少架构复杂度并实现解耦，推荐 **优先使用 HTTP/WebSocket** 进行跨进程通信，仅在必须时使用 IPC。

*   **UI/Window -> Main (Request/Response)**:
    *   **推荐方式**: `this.api.http.post('/api/plugins/:id/action', data)`
    *   **说明**: 通过标准 HTTP 接口调用 Main 插件暴露的功能。
    *   **IPC 备选**: `ipc.invoke` (仅限 Electron 原生能力调用，如窗口控制)。
*   **Main -> UI/Window (Event Push)**:
    *   **统一方式**: `this.api.broadcast(event, payload)`
    *   **底层实现**: Main (Worker) -> HTTP -> Main Process -> SSE/WebSocket -> UI/Window。
    *   **说明**: Main 插件不应感知 UI/Window 的具体实现（Electron WebContents），而是向“前端”广播事件。
### 8.2 Any → Overlay (单向广播)
Overlay 设计为被动展示层（通常在 OBS 中），网络环境和运行时可能受限，因此采用**单向下行**通信模式。

*   **发送端 (Main / UI / Window)**:
    *   **接口**: `this.api.overlay.send(overlayId, event, payload)`
    *   **说明**: 无论是 Main 还是 UI/Window，均调用统一的 SDK 接口。底层自动选择最佳传输方式（Main 走 HTTP, UI/Window 走 IPC 或 HTTP）。
*   **接收端 (Overlay)**:
    *   **接口**: `window.overlayApi.on('message', (msg) => { ... })`
    *   **说明**: 监听来自消息中心 (SSE) 的统一消息流。
*   **约束**:
    *   Overlay **不能** 向 UI/Window 发送自定义消息。
    *   Overlay **不能** 调用 `ipc.invoke` 或访问 `remote` 对象。

## 9. 其他 (Utilities & Infrastructure)

### 网络服务

### 日志 `logger.*` [已实现]
*支持 `[All]`*
- `info(msg)`, `warn(msg)`, `error(msg)`: 将插件日志统一输出到主程序日志系统，方便排查问题。 `[All]`

### 配置管理 `settings.*` [已实现]
*支持 `[All]`*
- `get(key)`: 获取插件配置 `[All]`
- `set(key, value)`: 保存插件配置 `[All]`
- `onChange(key, callback)`: 监听配置变更 `[All]`
