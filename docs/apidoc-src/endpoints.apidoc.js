/**
 * @api {get} /api/events 查询事件
 * @apiName QueryEvents
 * @apiGroup Core
 * @apiDescription 支持按房间、时间范围、类型、用户、关键词等过滤，分页返回。
 * @apiQuery {String} [room_id] 房间ID
 * @apiQuery {String} [room_kw] 房间关键词
 * @apiQuery {Number} [from_ts] 起始时间戳(ms)
 * @apiQuery {Number} [to_ts] 截止时间戳(ms)
 * @apiQuery {String} [types] 事件类型，逗号分隔
 * @apiQuery {String} [user_id] 用户ID
 * @apiQuery {String} [user_kw] 用户关键词
 * @apiQuery {String} [q] 关键词
 * @apiQuery {Number} [page=1] 页码
 * @apiQuery {Number{1-1000}} [pageSize=200] 每页数量
 * @apiSuccess {Object[]} items 事件列表
 * @apiSuccess {Number} total 总条数
 * @apiSuccess {Number} page 当前页码
 * @apiSuccess {Number} pageSize 每页数量
 * @apiSuccess {Boolean} hasNext 是否有下一页
 * @apiSuccess (items) {Number} ts 事件时间戳
 * @apiSuccess (items) {Number} received_at 收到时间戳
 * @apiSuccess (items) {String} room_id 房间ID
 * @apiSuccess (items) {String} source 事件来源
 * @apiSuccess (items) {String} event_type 事件类型
 * @apiSuccess (items) {String} [user_id] 用户ID
 * @apiSuccess (items) {String} [user_name] 用户名
 * @apiSuccess (items) {String} [content] 内容
 * @apiSuccess (items) {Object} [raw] 原始数据对象
 * @apiSuccessExample {json} 成功示例:
 *  HTTP/1.1 200 OK
 *  {
 *    "page": 1,
 *    "pageSize": 200,
 *    "total": 1234,
 *    "hasNext": true,
 *    "items": [{ "ts": 1730000000000, "received_at": 1730000000500, "room_id": "123", "source": "ws", "event_type": "comment", "user_id": "u1", "user_name": "张三", "content": "hello", "raw": {"text":"hello"} }]
 *  }
 * @apiErrorExample {json} 错误示例(pageSize):
 *  HTTP/1.1 400 Bad Request
 *  { "error": "Invalid pageSize. Must be between 1 and 1000." }
 * @apiErrorExample {json} 错误示例(page):
 *  HTTP/1.1 400 Bad Request
 *  { "error": "Invalid page. Must be >= 1." }
 * @apiExample {curl} 示例:
 *  curl "http://127.0.0.1:18299/api/events?page=1&pageSize=50&types=comment,gift"
 */

/**
 * @api {get} /api/health 健康检查
 * @apiName Health
 * @apiGroup Core
 * @apiSuccess {String} status 固定"ok"
 * @apiSuccess {Number} timestamp 服务时间戳
 * @apiSuccess {Number} websocket_clients 当前WS连接数
 */

/**
 * @api {post} /api/popup 全局弹窗
 * @apiName GlobalPopup
 * @apiGroup Core
 * @apiDescription 在主窗口或指定插件窗口弹出 toast/alert/confirm。
 * @apiHeader {String} [X-Plugin-ID] 目标插件窗口ID（不传则主窗口）
 * @apiBody {String} action 弹窗类型：toast|alert|confirm
 * @apiBody {String} [title] 标题（alert/confirm）
 * @apiBody {String} message 文本内容
 * @apiBody {Object} [options] 额外选项
 * @apiBody {String} [windowId] 指定窗口ID（优先于 X-Plugin-ID）
 * @apiSuccess {Boolean} success 是否成功
 * @apiErrorExample {json} 失败示例:
 *  HTTP/1.1 404 Not Found
 *  { "success": false, "error": "WINDOW_NOT_FOUND" }
 */

/**
 * @api {post} /api/windows/show 显示并聚焦窗口
 * @apiName WindowShow
 * @apiGroup Core
 * @apiBody {String} [windowId] 插件窗口ID（不传则主窗口）
 * @apiBody {String} [pluginId] 同 windowId，用于兼容
 * @apiSuccess {Boolean} success 是否成功
 */

/**
 * @api {post} /api/windows/focus 聚焦窗口
 * @apiName WindowFocus
 * @apiGroup Core
 * @apiBody {String} [windowId] 插件窗口ID（不传则主窗口）
 * @apiBody {String} [pluginId] 同 windowId，用于兼容
 * @apiSuccess {Boolean} success 是否成功
 */

/**
 * @api {post} /api/windows/close 关闭窗口
 * @apiName WindowClose
 * @apiGroup Core
 * @apiBody {String} [windowId] 插件窗口ID（不传则主窗口）
 * @apiBody {String} [pluginId] 同 windowId，用于兼容
 * @apiSuccess {Boolean} success 是否成功
 */

/**
 * @api {get} /api/windows/list 窗口列表
 * @apiName WindowList
 * @apiGroup Core
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object[]} windows 窗口数组
 * @apiSuccess (windows) {String} windowId 窗口ID（主窗口为"main"）
 * @apiSuccess (windows) {Boolean} visible 是否可见
 * @apiSuccess (windows) {Boolean} focused 是否聚焦
 */

/**
 * @api {get} /api/windows/self 调用方窗口标识
 * @apiName WindowSelf
 * @apiGroup Core
 * @apiHeader {String} [X-Plugin-ID] 插件窗口ID
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {String} windowId 窗口ID（主窗口为"main"）
 */

/**
 * @api {get} /api/plugins 插件列表
 * @apiName Plugins
 * @apiGroup Core
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object[]} plugins 已安装插件数组
 * @apiErrorExample {json} 失败示例:
 *  HTTP/1.1 503 Service Unavailable
 *  { "success": false, "error": "PLUGIN_MANAGER_NOT_AVAILABLE" }
 */

/**
 * @api {get} /api/console/data 控制台数据
 * @apiName ConsoleData
 * @apiGroup Core
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object} data 数据
 * @apiSuccess {Object[]} data.commands 命令列表
 * @apiSuccess {Object[]} data.sessions 会话列表
 * @apiSuccess {Number} data.websocket_clients WS连接数
 */

/**
 * @api {get} /sse/overlay/:overlayId Overlay SSE
 * @apiName OverlaySSE
 * @apiGroup Core
 * @apiDescription 订阅指定 Overlay 的事件（更新、消息、关闭、动作）
 * @apiParam {String} overlayId Overlay标识
 * @apiHeader (SSE) {String} Accept text/event-stream
 */

/**
 * @api {get} /sse/plugins/:pluginId/overlay 插件Overlay SSE
 * @apiName PluginOverlaySSE
 * @apiGroup Core
 * @apiParam {String} pluginId 插件ID
 * @apiHeader (SSE) {String} Accept text/event-stream
 */

/**
 * @api {get} /api/stats/events 事件统计
 * @apiName EventStats
 * @apiGroup Core
 * @apiDescription 返回聚合事件统计。
 * @apiQuery {String} [room_id] 房间ID
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Number} total 总事件数
 * @apiSuccess {Object} byType 按类型聚合，如 {"comment":100,"gift":20}
 * @apiSuccess {Object} dateRange 时间范围
 * @apiSuccess {Number} dateRange.earliest 最早事件时间戳
 * @apiSuccess {Number} dateRange.latest 最晚事件时间戳
 * @apiSuccessExample {json} 成功示例:
 *  HTTP/1.1 200 OK
 *  { "success": true, "total": 120, "byType": {"comment": 100, "gift": 20}, "dateRange": {"earliest": 1729999000000, "latest": 1730000000000} }
 */

/**
 * @api {get} /api/export 导出CSV（查询参数）
 * @apiName ExportCsvQuery
 * @apiGroup Core
 * @apiQuery {String} [room_id] 房间ID
 * @apiQuery {Number} [from_ts] 起始时间戳(ms)
 * @apiQuery {Number} [to_ts] 截止时间戳(ms)
 * @apiQuery {String} [type] 事件类型
 * @apiQuery {String} [filename] 文件名
 * @apiQuery {Boolean} [includeRaw=false] 是否包含原始数据
 * @apiSuccess {String} filename 文件名
 * @apiSuccess {String} filepath 文件路径
 * @apiSuccess {Number} recordCount 记录条数
 * @apiSuccess {Number} fileSize 文件大小字节
 */

/**
 * @api {post} /api/export 导出CSV（请求体）
 * @apiName ExportCsvBody
 * @apiGroup Core
 * @apiBody {String} [room_id] 房间ID
 * @apiBody {Number} [from_ts] 起始时间戳(ms)
 * @apiBody {Number} [to_ts] 截止时间戳(ms)
 * @apiBody {String} [type] 事件类型
 * @apiBody {String} [filename] 文件名
 * @apiBody {Boolean} [includeRaw=false] 是否包含原始数据
 * @apiSuccess {Boolean} success 成功标记
 * @apiSuccess {String} filename 文件名
 * @apiSuccess {String} filepath 文件路径
 * @apiSuccess {Number} recordCount 记录条数
 * @apiSuccess {Number} fileSize 文件大小字节
 */

/**
 * @api {get} /sse/renderer/readonly-store 只读仓库SSE订阅
 * @apiName ReadonlyStoreSSE
 * @apiGroup Core
 * @apiDescription 建立SSE连接以接收只读仓库更新与心跳。
 * @apiHeader (SSE) {String} Accept text/event-stream
 * @apiSuccessExample {text} SSE 示例:
 *  event: heartbeat\n
 *  data: {"ts": 1730000000000}\n\n
 * @apiExample {curl} 示例:
 *  curl -H "Accept: text/event-stream" "http://127.0.0.1:18299/sse/renderer/readonly-store"
 */

/**
 * @api {get} /sse/system/logs 系统日志SSE
 * @apiName SystemLogsSSE
 * @apiGroup Core
 * @apiDescription 初始化推送最近日志（event: init），后续以 event: log 推送单条；包含心跳 event: heartbeat
 * @apiHeader (SSE) {String} Accept text/event-stream
 * @apiSuccessExample {text} 示例:
 *  event: init\n
 *  data: [{"level":"error","source":"ApiServer","timestamp":"...","message":"..."}]\n\n
 *  event: log\n
 *  data: {"level":"info","source":"WsHub","timestamp":"...","message":"..."}\n\n
 *  event: heartbeat\n
 *  data: {"ts": 1730000000000}\n\n
 */

/**
 * @api {all} /api/acfun/* AcFun代理端点
 * @apiName AcfunProxy
 * @apiGroup AcFun
 * @apiDescription 统一代理库的HTTP端点。部分端点需要登录，未登录返回 401。
 * @apiSuccess {Boolean} success 成功标记
 * @apiSuccess {Object} [data] 返回数据
 * @apiError {String} [error] 错误信息
*/

/**
 * @api {post} /api/acfun/image/upload 图片上传
 * @apiName ImageUpload
 * @apiGroup AcFun
 * @apiBody {String} imageFile 图片数据（dataURI/URL/路径）
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object} data 上传结果
 * @apiErrorExample {json} 错误示例:
 *  HTTP/1.1 400 Bad Request
 *  { "success": false, "error": "Missing imageFile parameter" }
 */

/**
 * @api {post} /api/acfun/eventsource/connect 事件源连接
 * @apiName EventSourceConnect
 * @apiGroup AcFun
 * @apiBody {String} liverUID 主播UID
 * @apiBody {String[]} [eventTypes] 事件类型数组
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object} data 返回消息
 * @apiErrorExample {json} 错误示例:
 *  HTTP/1.1 400 Bad Request
 *  { "success": false, "error": "Missing liverUID parameter" }
 */

/**
 * @api {post} /api/acfun/eventsource/disconnect 事件源断开
 * @apiName EventSourceDisconnect
 * @apiGroup AcFun
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object} data 返回消息
 */

/**
 * @api {get} /api/acfun/live/categories 直播分类
 * @apiName LiveCategories
 * @apiGroup AcFun
 * @apiDescription 返回直播分类列表。
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object[]} data 分类数组
 * @apiSuccessExample {json} 成功示例:
 *  HTTP/1.1 200 OK
 *  { "success": true, "data": [{ "id": 1, "name": "游戏" }] }
 * @apiErrorExample {json} 失败示例:
 *  HTTP/1.1 500 Internal Server Error
 *  { "success": false, "error": "Internal server error" }
 */

/**
 * @api {get} /api/acfun/live/hot-lives 热门直播
 * @apiName HotLives
 * @apiGroup AcFun
 * @apiDescription 按分类与分页返回热门直播列表。
 * @apiQuery {String} [category] 分类标识
 * @apiQuery {Number} [page=1] 页码
 * @apiQuery {Number} [size=20] 每页数量
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object[]} data 直播数组
 * @apiExample {curl} 示例:
 *  curl "http://127.0.0.1:18299/api/acfun/live/hot-lives?page=1&size=10"
 * @apiErrorExample {json} 失败示例:
 *  HTTP/1.1 500 Internal Server Error
 *  { "success": false, "error": "Internal server error" }
 */

/**
 * @api {get} /api/acfun/live/permission 开播权限查询
 * @apiName LivePermission
 * @apiGroup AcFun
 * @apiDescription 需要登录；未登录或token无效返回 401
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object} data 权限信息
 * @apiErrorExample {json} 认证失败:
 *  HTTP/1.1 401 Unauthorized
 *  { "success": false, "error": "未登录或token无效" }
 */

/**
 * @api {get} /api/acfun/live/stream-url 推流地址
 * @apiName LiveStreamUrl
 * @apiGroup AcFun
 * @apiQuery {String} liveId 直播ID
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object} data 推流地址信息
 * @apiErrorExample {json} 错误示例:
 *  HTTP/1.1 400 Bad Request
 *  { "success": false, "error": "liveId is required" }
 */

/**
 * @api {get} /api/acfun/live/stream-settings 推流设置
 * @apiName LiveStreamSettings
 * @apiGroup AcFun
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object} data 设置
 */

/**
 * @api {get} /api/acfun/live/stream-status 推流状态
 * @apiName LiveStreamStatus
 * @apiGroup AcFun
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object} data 状态
 * @apiErrorExample {json} 认证失败:
 *  HTTP/1.1 401 Unauthorized
 *  { "success": false, "error": "未登录或token无效" }
 */

/**
 * @api {get} /api/acfun/live/transcode-info 转码信息
 * @apiName TranscodeInfo
 * @apiGroup AcFun
 * @apiQuery {String} streamName 流名
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object} data 信息
 * @apiErrorExample {json} 错误示例:
 *  HTTP/1.1 400 Bad Request
 *  { "success": false, "error": "streamName is required" }
 */

/**
 * @api {post} /api/acfun/live/start 开始直播
 * @apiName LiveStart
 * @apiGroup AcFun
 * @apiBody {String} title 标题
 * @apiBody {String} streamName 流名
 * @apiBody {Number} categoryID 分类ID
 * @apiBody {Number} subCategoryID 子分类ID
 * @apiBody {String} [coverFile] 封面
 * @apiBody {Boolean} [portrait] 竖屏
 * @apiBody {Boolean} [panoramic] 全景
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object} data 返回
 * @apiErrorExample {json} 错误示例:
 *  HTTP/1.1 400 Bad Request
 *  { "success": false, "error": "title, streamName, categoryID, and subCategoryID are required" }
 */

/**
 * @api {post} /api/acfun/live/stop 停止直播
 * @apiName LiveStop
 * @apiGroup AcFun
 * @apiBody {String} liveId 直播ID
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object} data 返回
 * @apiErrorExample {json} 错误示例:
 *  HTTP/1.1 400 Bad Request
 *  { "success": false, "error": "liveId is required" }
 */

/**
 * @api {put} /api/acfun/live/update 更新直播间
 * @apiName LiveUpdate
 * @apiGroup AcFun
 * @apiBody {String} title 标题
 * @apiBody {String} liveId 直播ID
 * @apiBody {String} [coverFile] 封面
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object} data 返回
 * @apiErrorExample {json} 错误示例:
 *  HTTP/1.1 400 Bad Request
 *  { "success": false, "error": "title and liveId are required" }
 */

/**
 * @api {get} /api/acfun/live/statistics 直播统计
 * @apiName LiveStatistics
 * @apiGroup AcFun
 * @apiQuery {Number} userId 用户ID
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object} data 统计映射
 * @apiErrorExample {json} 错误示例:
 *  HTTP/1.1 400 Bad Request
 *  { "success": false, "error": "userId is required" }
 */

/**
 * @api {get} /api/acfun/live/summary 直播摘要
 * @apiName LiveSummary
 * @apiGroup AcFun
 * @apiQuery {String} liveId 直播ID
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object} data 摘要
 * @apiErrorExample {json} 错误示例:
 *  HTTP/1.1 400 Bad Request
 *  { "success": false, "error": "liveId is required" }
 */

/**
 * @api {get} /api/acfun/live/watching-list 观众列表
 * @apiName WatchingList
 * @apiGroup AcFun
 * @apiQuery {String} [liveId] 直播ID
 * @apiQuery {Number} [userId] 用户ID（可替代liveId）
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object[]} data 观众数组
 * @apiErrorExample {json} 错误示例:
 *  HTTP/1.1 400 Bad Request
 *  { "success": false, "error": "liveId or userId is required" }
 */

/**
 * @api {get} /api/acfun/live/clip-permission 剪辑权限查询
 * @apiName ClipPermissionGet
 * @apiGroup AcFun
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object} data 权限状态
 */

/**
 * @api {put} /api/acfun/live/clip-permission 设置剪辑权限
 * @apiName ClipPermissionSet
 * @apiGroup AcFun
 * @apiBody {Boolean} canCut 是否允许剪辑
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object} data 返回
 * @apiErrorExample {json} 错误示例:
 *  HTTP/1.1 400 Bad Request
 *  { "success": false, "error": "canCut is required" }
 */

/**
 * @api {get} /api/acfun/gift/all 全量礼物列表
 * @apiName GiftAll
 * @apiGroup AcFun
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object[]} data 礼物数组
 */

/**
 * @api {get} /api/acfun/replay/info 直播回放信息
 * @apiName LiveReplayInfo
 * @apiGroup AcFun
 * @apiQuery {String} liveId 直播ID
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object} data 回放信息
 * @apiErrorExample {json} 错误示例:
 *  HTTP/1.1 400 Bad Request
 *  { "success": false, "error": "liveId is required" }
 */

/**
 * @api {get} /api/acfun/user/info 获取用户信息
 * @apiName UserInfo
 * @apiGroup AcFun
 * @apiQuery {String} userId 用户ID（字符串）
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object} data 用户信息
 * @apiErrorExample {json} 错误示例:
 *  HTTP/1.1 400 Bad Request
 *  { "success": false, "error": "userId is required" }
 * @apiErrorExample {json} 失败示例:
 *  HTTP/1.1 500 Internal Server Error
 *  { "success": false, "error": "User endpoint error" }
 */

/**
 * @api {post} /api/acfun/danmu/start 开始弹幕会话
 * @apiName DanmuStart
 * @apiGroup Danmu
 * @apiBody {String} liverUID 主播UID
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object} data 返回数据
 * @apiErrorExample {json} 错误示例:
 *  HTTP/1.1 400 Bad Request
 *  { "success": false, "error": "liverUID is required" }
 */

/**
 * @api {post} /api/acfun/danmu/stop 停止弹幕会话
 * @apiName DanmuStop
 * @apiGroup Danmu
 * @apiBody {String} sessionId 会话ID
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object} data 返回数据
 * @apiErrorExample {json} 错误示例:
 *  HTTP/1.1 400 Bad Request
 *  { "success": false, "error": "sessionId is required" }
 */

/**
 * @api {get} /api/acfun/danmu/room-info 获取直播间信息
 * @apiName DanmuRoomInfo
 * @apiGroup Danmu
 * @apiQuery {String} liverUID 主播UID
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object} data 直播间信息
 * @apiErrorExample {json} 错误示例:
 *  HTTP/1.1 400 Bad Request
 *  { "success": false, "error": "liverUID is required" }
 */

/**
 * @api {get} /api/acfun/gift/live 直播礼物列表
 * @apiName LiveGiftList
 * @apiGroup AcFun
 * @apiQuery {String} liveID 直播ID
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object[]} data 礼物数组
 * @apiErrorExample {json} 错误示例:
 *  HTTP/1.1 400 Bad Request
 *  { "success": false, "error": "liveID is required" }
 */

/**
 * @api {get} /api/acfun/preview/list 直播预告列表
 * @apiName LivePreviewList
 * @apiGroup AcFun
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object[]} data 预告数组
 */

/**
 * @api {get} /api/acfun/badge/detail 徽章详情
 * @apiName BadgeDetail
 * @apiGroup AcFun
 * @apiQuery {Number} uperID UP主ID
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object} data 详情
 * @apiErrorExample {json} 错误示例:
 *  HTTP/1.1 400 Bad Request
 *  { "success": false, "error": "uperID is required" }
 */

/**
 * @api {get} /api/acfun/badge/list 徽章列表
 * @apiName BadgeList
 * @apiGroup AcFun
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object[]} data 列表
 */

/**
 * @api {get} /api/acfun/badge/rank 徽章排行
 * @apiName BadgeRank
 * @apiGroup AcFun
 * @apiQuery {Number} uperID UP主ID
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object[]} data 排行
 * @apiErrorExample {json} 错误示例:
 *  HTTP/1.1 400 Bad Request
 *  { "success": false, "error": "uperID is required" }
 */

/**
 * @api {get} /api/acfun/badge/worn 当前佩戴徽章
 * @apiName BadgeWorn
 * @apiGroup AcFun
 * @apiQuery {Number} userID 用户ID
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object} data 徽章信息
 * @apiErrorExample {json} 错误示例:
 *  HTTP/1.1 400 Bad Request
 *  { "success": false, "error": "userID is required" }
 */

/**
 * @api {post} /api/acfun/badge/wear 佩戴徽章
 * @apiName BadgeWear
 * @apiGroup AcFun
 * @apiBody {Number} uperID UP主ID
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object} data 返回信息
 * @apiErrorExample {json} 错误示例:
 *  HTTP/1.1 400 Bad Request
 *  { "success": false, "error": "uperID is required" }
 */

/**
 * @api {post} /api/acfun/badge/unwear 取消佩戴徽章
 * @apiName BadgeUnwear
 * @apiGroup AcFun
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object} data 返回信息
 */

/**
 * @api {get} /plugins/:id/overlay Overlay页面托管
 * @apiName PluginOverlayHosting
 * @apiGroup Plugin
 * @apiDescription 托管插件Overlay页面及静态资源。
 * @apiParam {String} id 插件ID
 * @apiSuccessExample {html} 示例:
 *  HTTP/1.1 200 OK
 *  <!doctype html> ...
 */

/**
 * @api {get} /plugins/:id/ui[/*] 插件UI静态托管
 * @apiName PluginUiHosting
 * @apiGroup Plugin
 * @apiParam {String} id 插件ID
 * @apiDescription 托管插件 UI 页面与静态资源；支持 /plugins/:id/ui.html 直达入口
 */

/**
 * @api {get} /plugins/:id/window[/*] 插件窗口静态托管
 * @apiName PluginWindowHosting
 * @apiGroup Plugin
 * @apiParam {String} id 插件ID
 * @apiDescription 托管插件窗口页面与静态资源；支持 /plugins/:id/window.html 直达入口
 */

/**
 * @api {get} /plugins/:id/overlay[/*] 插件Overlay静态托管
 * @apiName PluginOverlayStatic
 * @apiGroup Plugin
 * @apiParam {String} id 插件ID
 * @apiDescription 托管插件 Overlay SPA/静态资源；支持 /plugins/:id/overlay.html 直达入口
 */

/**
 * @api {get} /plugins/:id/ui/icon.svg 禁用插件图标例外
 * @apiName PluginIconAccess
 * @apiGroup Plugin
 * @apiParam {String} id 插件ID
 * @apiDescription 插件禁用时仅允许访问图标资源，其余页面/静态资源返回 403
 * @apiErrorExample {json} 403示例:
 *  HTTP/1.1 403 Forbidden
 *  { "error": "PLUGIN_DISABLED", "pluginId": "xxx", "path": "/window/index.html" }
 */

/**
 * @api {get} /sse/overlay/:overlayId Overlay SSE 事件类型
 * @apiName OverlaySSEEvents
 * @apiGroup Core
 * @apiParam {String} overlayId Overlay标识
 * @apiDescription 事件类别包括：updated、message、closed、action；包含心跳 event: heartbeat
 * @apiSuccessExample {text} 心跳示例:
 *  event: heartbeat\n
 *  data: {"ts": 1730000000000}\n\n
 */

/**
 * @api {get} /sse/plugins/:pluginId/overlay Last-Event-ID 支持
 * @apiName PluginOverlaySSELastEvent
 * @apiGroup Core
 * @apiParam {String} pluginId 插件ID
 * @apiHeader (SSE) {String} Last-Event-ID 用于恢复历史推送
 */

/**
 * @api {get} /api/acfun/auth/status 认证状态
 * @apiName AuthStatus
 * @apiGroup Auth
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object} data 数据
 * @apiSuccess {Boolean} data.authenticated 是否已认证
 * @apiSuccess {Number} data.timestamp 时间戳
 */

/**
 * @api {post} /api/acfun/auth/qr-login 二维码登录
 * @apiName AuthQrLogin
 * @apiGroup Auth
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object} data 数据（包含 qrCode/expiresIn/sessionId）
 */

/**
 * @api {get} /api/acfun/auth/qr-status 二维码登录状态
 * @apiName AuthQrStatus
 * @apiGroup Auth
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object} data 状态
 */

/**
 * @api {post} /api/acfun/auth/token 写入令牌
 * @apiName AuthTokenSet
 * @apiGroup Auth
 * @apiBody {Object|String} token 令牌对象或JSON字符串
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object} data 返回消息
 * @apiErrorExample {json} 错误示例:
 *  HTTP/1.1 400 Bad Request
 *  { "success": false, "error": "Token is required" }
 */

/**
 * @api {delete} /api/acfun/auth/token 清除令牌
 * @apiName AuthTokenClear
 * @apiGroup Auth
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object} data 返回消息
 */
/**
 * @api {post} /api/console/sessions 创建控制台会话
 * @apiName ConsoleSessionCreate
 * @apiGroup Console
 * @apiBody {String} [name] 会话名称
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object} session 会话对象
 */

/**
 * @api {delete} /api/console/sessions/:sessionId 结束控制台会话
 * @apiName ConsoleSessionEnd
 * @apiGroup Console
 * @apiParam {String} sessionId 会话ID
 * @apiSuccess {Boolean} success 是否成功
 */

/**
 * @api {post} /api/console/sessions/:sessionId/execute 执行控制台命令
 * @apiName ConsoleExecute
 * @apiGroup Console
 * @apiParam {String} sessionId 会话ID
 * @apiBody {String} command 命令
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object} result 执行结果
 */

/**
 * @api {get} /api/console/commands 获取可用命令列表
 * @apiName ConsoleCommands
 * @apiGroup Console
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object[]} commands 命令数组
 */

/**
 * @api {get} /api/console/sessions 获取活动会话列表
 * @apiName ConsoleSessions
 * @apiGroup Console
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object[]} sessions 会话数组
 */

/**
 * @api {get} /api/console/sessions/:sessionId 获取特定会话信息
 * @apiName ConsoleSessionInfo
 * @apiGroup Console
 * @apiParam {String} sessionId 会话ID
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object} session 会话对象
 * @apiErrorExample {json} 404示例:
 *  HTTP/1.1 404 Not Found
 *  { "success": false, "error": "Session not found" }
 */

/**
 * @api {get} /api/logs 获取日志
 * @apiName LogsGet
 * @apiGroup Diagnostics
 * @apiQuery {String="info","error","warn","debug"} [level] 级别
 * @apiQuery {String} [source] 来源关键字
 * @apiQuery {Number} [from_ts] 起始时间戳(ms)
 * @apiQuery {Number} [to_ts] 截止时间戳(ms)
 * @apiQuery {Number} [limit=200] 最大条数(<=1000)
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object[]} data 日志数组
 */

/**
 * @api {post} /api/logs/export 导出错误日志
 * @apiName LogsExport
 * @apiGroup Diagnostics
 * @apiBody {String} [level="error"] 级别
 * @apiBody {String} [source] 来源关键字
 * @apiBody {Number} [from_ts] 起始时间戳(ms)
 * @apiBody {Number} [to_ts] 截止时间戳(ms)
 * @apiBody {Number} [limit=1000] 最大条数(<=5000)
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {String} filepath 导出文件路径
 * @apiSuccess {Number} count 导出条数
 */
/**
 * @api {get} /api/overlay/:overlayId 获取Overlay数据
 * @apiName OverlayGet
 * @apiGroup Overlay
 * @apiParam {String} overlayId Overlay标识
 * @apiQuery {String} [room] 房间标识
 * @apiQuery {String} [token] 令牌
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {Object} data 数据
 * @apiSuccess {Object} data.overlay Overlay对象
 * @apiSuccess {String} data.websocket_endpoint WebSocket端点
 * @apiErrorExample {json} 404示例:
 *  HTTP/1.1 404 Not Found
 *  { "success": false, "error": "OVERLAY_NOT_FOUND", "overlayId": "xxx" }
 */

/**
 * @api {post} /api/overlay/:overlayId/action 触发Overlay动作
 * @apiName OverlayAction
 * @apiGroup Overlay
 * @apiParam {String} overlayId Overlay标识
 * @apiBody {String} action 动作名
 * @apiBody {Object} [data] 动作数据
 * @apiSuccess {Boolean} success 是否成功
 * @apiErrorExample {json} 400示例:
 *  HTTP/1.1 400 Bad Request
 *  { "success": false, "error": "INVALID_ACTION" }
 * @apiErrorExample {json} 500示例:
 *  HTTP/1.1 500 Internal Server Error
 *  { "success": false, "error": "ACTION_FAILED" }
 */

/**
 * @api {post} /api/overlay/:overlayId/send 向Overlay发送自定义消息
 * @apiName OverlaySend
 * @apiGroup Overlay
 * @apiParam {String} overlayId Overlay标识
 * @apiBody {String} event 事件名
 * @apiBody {Object} [payload] 负载
 * @apiSuccess {Boolean} success 是否成功
 * @apiErrorExample {json} 400示例:
 *  HTTP/1.1 400 Bad Request
 *  { "success": false, "error": "INVALID_EVENT" }
 * @apiErrorExample {json} 500示例:
 *  HTTP/1.1 500 Internal Server Error
 *  { "success": false, "error": "SEND_FAILED" }
 */

/**
 * @api {post} /api/overlay/create 创建Overlay
 * @apiName OverlayCreate
 * @apiGroup Overlay
 * @apiBody {Object} options Overlay创建参数（含 pluginId/style 等）
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {String} [overlayId] 创建或返回的唯一ID
 * @apiErrorExample {json} 500示例:
 *  HTTP/1.1 500 Internal Server Error
 *  { "success": false, "error": "CREATE_FAILED" }
 */

/**
 * @api {post} /api/plugins/:pluginId/overlay/messages 发布Overlay消息
 * @apiName PluginOverlayMessages
 * @apiGroup Plugin
 * @apiParam {String} pluginId 插件ID
 * @apiBody {String} [overlayId] 目标 OverlayId，缺省则广播
 * @apiBody {String} event 事件名
 * @apiBody {Object} [payload] 负载
 * @apiBody {Number} [ttlMs] 存活时间(ms)
 * @apiBody {Boolean} [persist=true] 是否持久
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {String} [id] 记录ID（单发）
 * @apiSuccess {Number} [count] 广播数量
 * @apiSuccess {String[]} [ids] 广播记录ID集合
 * @apiErrorExample {json} 400示例:
 *  HTTP/1.1 400 Bad Request
 *  { "success": false, "error": "INVALID_EVENT" }
 */

/**
 * @api {post} /api/renderer/readonly-store 上报只读仓库快照
 * @apiName RendererReadonlyStorePost
 * @apiGroup Renderer
 * @apiBody {String="readonly-store-init","readonly-store-update"} type 事件类型
 * @apiBody {Object} payload 数据快照
 * @apiSuccess {Boolean} success 是否成功
 * @apiSuccess {String} id 记录ID
 * @apiErrorExample {json} 400示例:
 *  HTTP/1.1 400 Bad Request
 *  { "success": false, "error": "INVALID_EVENT" }
 */

/**
 * @api {get} /overlay-wrapper Overlay包装页
 * @apiName OverlayWrapper
 * @apiGroup Overlay
 * @apiQuery {String} plugin 插件ID
 * @apiQuery {String="overlay","ui","window"} [type=overlay] 页面类型
 * @apiQuery {String} [overlayId] Overlay标识
 * @apiQuery {String} [route] SPA子路由
 * @apiQuery {String} [html] 静态入口文件名
 * @apiSuccessExample {html} 成功示例:
 *  HTTP/1.1 200 OK
 *  <!doctype html> ...
 * @apiErrorExample {html} 404示例:
 *  HTTP/1.1 404 Not Found
 *  Plugin 'xxx' not found.
 * @apiErrorExample {html} 403示例:
 *  HTTP/1.1 403 Forbidden
 *  Plugin 'xxx' is disabled.
 */