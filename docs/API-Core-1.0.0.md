# ACFun Live Toolbox API 文档（v1.0.0）

## 概述
- 版本：`1.0.0`
- 基址：`http://127.0.0.1:<port>`（默认 `18299`，可在配置中更改）
- 风格：REST + SSE（Server-Sent Events）
- 说明：文档严格依据当前代码实现整理，包含系统/控制台、只读仓库、Overlay、插件消息中心、AcFun API 代理等模块的接口。

## 接口调用规范
- 路径均以 `/api` 或 `/sse` 开头；统一返回 JSON；SSE 返回事件流。
- 所有接口均归属于版本 `1.0.0`（当前服务根路径返回的 `version` 字段）。
- 示例 URL 写作完整路径（含方法）：例如 `GET /api/health`。

## 模块与端点一览

### 系统与控制台
- `GET /api/health`：健康检查
- `GET /api/events`：事件查询（分页）
- `GET /api/stats/events`：事件统计
- `GET /api/diagnostics`：系统诊断（根端点列表中声明）
- `GET /api/logs`：应用日志列表
- `POST /api/logs/export`：日志导出
- `GET /api/console/data`：控制台页数据
- `POST /api/console/sessions`：创建控制台会话
- `GET /api/console/sessions`：会话列表
- `GET /api/console/sessions/:sessionId`：会话详情
- `POST /api/console/sessions/:sessionId/execute`：在会话中执行命令

### 只读仓库（渲染层→主进程→SSE）
- `POST /api/renderer/readonly-store`：上报只读仓库事件（`readonly-store-init`/`readonly-store-update`）
- `GET /api/renderer/readonly-store/list`：列出最近快照包含的键
- `POST /api/renderer/readonly-store/snapshot`：按键提取快照
- `GET /sse/renderer/readonly-store/subscribe?keys=account,ui,stream`：订阅指定键的快照与增量

### Overlay 管理与消息
- `POST /api/overlay/create`：创建 Overlay（单实例策略，返回ID或复用)
- `GET /api/overlay/:overlayId`：查询指定 Overlay 信息
- `POST /api/overlay/:overlayId/action`：控制动作（`update`/`close`/`show`/`hide`/`bringToFront` 等）
- `POST /api/overlay/:overlayId/send`：向 Overlay 发送自定义消息（转发到事件总线）
- `POST /api/plugins/:pluginId/overlay/messages`：插件级入队消息（可广播到插件所有 Overlay）
- `GET /sse/overlay/:overlayId`：订阅单 Overlay 事件（`init/update/message/action/closed/heartbeat`）
- `GET /sse/plugins/:pluginId/overlay`：订阅插件级消息中心（`init/update/message/action/closed/heartbeat`，支持回放）

### 窗口与弹窗
- 弹窗
  - `POST /api/popup`
    - Headers：`Content-Type: application/json`; 可选 `X-Plugin-ID: <pluginId>`（目标插件窗口）；缺省主窗口
    - Body：
      - `action`: `toast` | `alert` | `confirm`（必填）
      - `title`: string（alert/confirm 可选）
      - `message`: string（必填）
      - `options`: object（可选）
      - `windowId`: string（可选；优先级高于 `X-Plugin-ID`）
    - Response：`{ success: true }`（confirm 结果为异步回传，不在 HTTP 同步返回）
- 窗口控制
  - `POST /api/windows/show`：显示并聚焦目标窗口（Body：`windowId?` | `pluginId?`；缺省主窗口）
  - `POST /api/windows/focus`：聚焦目标窗口（Body 同上）
  - `POST /api/windows/close`：关闭目标窗口（Body 同上）
  - `GET /api/windows/list`：列出主窗口与所有插件窗口状态（`windowId/visible/focused`）
  - `GET /api/windows/self`：返回调用方窗口标识（优先 `X-Plugin-ID`，否则 `main`）

### AcFun API 代理
- 统一入口：`ALL /api/acfun/*`（内部路由分发）
- 认证
  - `GET /api/acfun/auth/status`：检查认证状态
  - `POST /api/acfun/auth/qr-login`：开始二维码登录
  - `GET /api/acfun/auth/qr-status`：查询扫码状态
  - `POST /api/acfun/auth/token`：设置令牌
  - `DELETE /api/acfun/auth/token`：清除令牌
- 用户
  - `GET /api/acfun/user/info?userId=<id>`：获取用户信息
  - `GET /api/acfun/user/wallet`：获取钱包信息
- 弹幕
  - `POST /api/acfun/danmu/start`：开始弹幕会话（`liverUID`）
  - `POST /api/acfun/danmu/stop`：停止弹幕会话（`sessionId`）
  - `GET /api/acfun/danmu/room-info?liverUID=<uid>`：获取直播间信息
- 直播
  - `GET /api/acfun/live/permission`：检查开播权限
  - `GET /api/acfun/live/stream-url?liveId=<id>`：获取推流地址
  - `GET /api/acfun/live/stream-settings`：获取推流设置
  - `GET /api/acfun/live/stream-status`：获取直播状态
  - `POST /api/acfun/live/start`：开始直播
  - `POST /api/acfun/live/stop`：结束直播
  - `PUT /api/acfun/live/update`：更新直播标题/封面
  - `GET /api/acfun/live/statistics?userId=<id>`：直播统计摘要
  - `GET /api/acfun/live/summary?liveId=<id>`：直播摘要信息
  - `GET /api/acfun/live/watching-list?liveId=<id>|userId=<id>`：观看名单
  - `GET /api/acfun/live/hot-lives`：热门直播列表
  - `GET /api/acfun/live/categories`：直播分类列表
  - `GET /api/acfun/live/user-info?userID=<id>`：主播直播信息
  - `GET /api/acfun/live/clip-permission` / `PUT /api/acfun/live/clip-permission`：剪辑权限
- 礼物
  - `GET /api/acfun/gift/all`：全量礼物列表
  - `GET /api/acfun/gift/live?liveID=<id>`：直播间礼物列表
- 房管
  - `GET /api/acfun/manager/list`：房管列表
  - `POST /api/acfun/manager/add`：添加房管
  - `DELETE /api/acfun/manager/remove`：移除房管
  - `GET /api/acfun/manager/kick-records?liveId=<id>&page=<n>&count=<m>`：踢人记录
  - `POST /api/acfun/manager/kick`：踢人（主播/房管）

## 请求结构说明

### 通用约定
- Headers
  - `Content-Type: application/json`（POST/PUT 等）
  - `X-Plugin-ID: <pluginId>`（可选；用于速率限制归属与插件识别）
- Query：按各接口说明传递；字符串需 URL 编码。
- Body：JSON 对象；字段类型与必填项见每接口定义。

### 示例：只读仓库上报
- `POST /api/renderer/readonly-store`
- Body
  - `type`（string，必填）：`readonly-store-init` | `readonly-store-update`
  - `payload`（object，必填）：任意键值切片，如 `{ account: {...}, ui: {...}, stream: {...} }`
- Headers：`Content-Type: application/json`

### 示例：创建 Overlay
- `POST /api/overlay/create`
- Body
  - `pluginId`（string，必填）：插件ID
  - `type`（string，可选，默认 `default`）：Overlay类型
  - `style`/`position`/`size` 等（object，可选）：样式与尺寸

### 示例：AcFun 开始直播
- `POST /api/acfun/live/start`
- Body
  - `title`（string，必填）
  - `coverFile`（string，可选，支持 `data:image/*` 或 URL）
  - `streamName`（string，必填）
  - `portrait`（boolean，可选，默认 `false`）
  - `panoramic`（boolean，可选，默认 `false`）
  - `categoryID`（number，必填）
  - `subCategoryID`（number，必填）

## 响应结构说明

### 通用成功响应
- 状态码：`200` / `201`（部分创建场景）
- 结构：`{ success: true, data: <任意>, code?: 200 }`

### 通用错误响应
- 状态码：`4xx`（参数/认证/权限）或 `5xx`（服务器错误）
- 结构：`{ success: false, error: <string>, code: <number> }`
- 常见：
  - `400` 缺少必填参数或格式错误
  - `401` 未登录或 token 无效（AcFun 代理）
  - `404` 不支持的端点或资源不存在
  - `429` 超出请求频率限制（速率限制器）
  - `500` 内部错误

### SSE 响应
- 头：
  - `Content-Type: text/event-stream`
  - `Cache-Control: no-cache`
  - `Connection: keep-alive`
  - `X-Accel-Buffering: no`
- 事件名与数据：
  - 系统日志：`init`（数组）、`log`（单条）、`heartbeat`
  - 只读仓库：`readonly-store-init`（对象）、`readonly-store-update`（对象）、`heartbeat`
  - 单 Overlay：`init`（overlay快照）、`update`、`message`、`action`、`closed`、`heartbeat`
  - 插件消息中心：`init`（overlay列表）、`update`/`message`/`action`/`closed`（带 `payload`）、`lifecycle`/`room`/`danmaku`（新增桥接）、`heartbeat`

## 安全与认证
- AcFun 代理端点需要应用处于已认证状态（通过二维码登录或设置 token）；未认证将返回 `401`。
- 速率限制：基于客户端标识（优先使用 `X-Plugin-ID`，否则 IP）。超限返回 `429`，并含 `retryAfter`。
- 跨域：允许本地开发源（如 `http://localhost:*`、`http://127.0.0.1:*`），其余按配置。
- SSE 无需认证，仅用于本地事件消费；注意长连接与心跳。

## 代码示例

### cURL：订阅系统日志（SSE）
```bash
curl -N http://127.0.0.1:18299/sse/system/logs
```

### cURL：订阅只读仓库 `account,ui,stream`
```bash
curl -N "http://127.0.0.1:18299/sse/renderer/readonly-store/subscribe?keys=account,ui,stream"
```

### cURL：创建 Overlay 并关闭
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"pluginId":"obs-assistant","type":"default"}' \
  http://127.0.0.1:18299/api/overlay/create

# 假设返回 overlayId=abc
curl -X POST -H "Content-Type: application/json" \
  -d '{"action":"close"}' \
  http://127.0.0.1:18299/api/overlay/abc/action
```

### cURL：主窗口弹窗与窗口控制
```bash
# 主窗口弹出toast
curl -X POST -H "Content-Type: application/json" \
  -d '{"action":"toast","message":"操作成功"}' \
  http://127.0.0.1:18299/api/popup

# 在指定插件窗口弹出alert
curl -X POST -H "Content-Type: application/json" -H "X-Plugin-ID: obs-assistant" \
  -d '{"action":"alert","title":"提示","message":"请检查设置"}' \
  http://127.0.0.1:18299/api/popup

# 显示并聚焦主窗口
curl -X POST http://127.0.0.1:18299/api/windows/show

# 聚焦指定插件窗口
curl -X POST -H "Content-Type: application/json" \
  -d '{"pluginId":"obs-assistant"}' \
  http://127.0.0.1:18299/api/windows/focus

# 获取窗口列表
curl http://127.0.0.1:18299/api/windows/list
```

### cURL：开始直播（AcFun）
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{
    "title":"今晚开播",
    "coverFile":"",
    "streamName":"live_stream_123",
    "portrait":false,
    "panoramic":false,
    "categoryID":1,
    "subCategoryID":101
  }' \
  http://127.0.0.1:18299/api/acfun/live/start
```

## 版本变更记录
- v1.0.0
  - 初版发布，覆盖系统/控制台、只读仓库、Overlay 与插件消息中心、AcFun 代理所有已实现端点
  - 插件消息中心新增桥接事件：`lifecycle`（插件启停/Overlay生命周期）、`room`（房间状态）、`danmaku`（归一化互动事件）
  - 新增窗口与弹窗 HTTP 接口：`/api/popup`、`/api/windows/*`

## 附录：数据结构示例

### `readonly-store-init`/`update` 数据示例
```json
{
  "account": { "isLoggedIn": true, "profile": { "userID": 123, "nickname": "主播", "avatar": "https://..." } },
  "ui": { "theme": "light", "sidebarCollapsed": false, "isFullscreen": false, "windowSize": { "width": 1024, "height": 768 } },
  "stream": { "rtmpUrl": "rtmp://...", "streamKey": "...", "expiresAt": 1730000000000 }
}
```

### 插件消息中心 `update/message/action/closed` 记录示例
```json
{
  "id": "evt_001",
  "meta": { "kind": "update" },
  "payload": { "overlayId": "ov_123", "event": "overlay-updated", "payload": { "id": "ov_123", "style": { "backgroundColor": "#000" } } }
}
```

### 房间状态与弹幕事件示例
```json
// room-status-change
{ "event": "room-status-change", "payload": { "roomId": "123", "status": "open" } }

// normalized-event（danmaku）
{ "event": "normalized-event", "payload": { "event_type": "danmaku", "room_id": "123", "user_id": "456", "user_name": "观众", "content": "666", "ts": 1730000000000 } }
```