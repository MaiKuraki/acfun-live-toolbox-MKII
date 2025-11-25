/**
 * Window插件事件和生命周期处理模板
 * 
 * 此文件提供了window插件可以接收的所有事件和生命周期钩子的空函数模板
 * 每个函数都包含详细的参数说明和使用示例
 */

// ===== 插件基础功能 =====

/**
 * 插件初始化
 * 在插件加载时调用，用于设置初始状态
 * @returns {Object} 返回初始化结果 { ok: boolean, message?: string }
 */
function init() {
  // 初始化插件状态、变量、定时器等
  return { ok: true, message: '插件初始化成功' };
}

/**
 * 插件清理
 * 在插件卸载或关闭时调用，用于清理资源
 * @returns {Object} 返回清理结果 { ok: boolean }
 */
function cleanup() {
  // 清理定时器、释放资源、保存状态等
  return { ok: true };
}

/**
 * 处理来自主进程的消息
 * @param {string} type - 消息类型
 * @param {any} payload - 消息负载
 * @returns {Object} 返回处理结果
 */
async function handleMessage(type, payload) {
  // 处理自定义消息
  return { ok: true, type, payload };
}

// ===== 直播事件处理 =====

/**
 * 直播开始事件
 * @param {Object} ctx - 事件上下文
 * @param {string} ctx.roomId - 房间ID
 * @param {string} ctx.streamerName - 主播名称
 * @param {string} ctx.liveTitle - 直播标题
 * @param {number} ctx.timestamp - 事件时间戳
 * @param {Object} ctx.extra - 额外信息
 */
async function onLiveStart(ctx = {}) {
  // 处理直播开始事件
  // 可以在这里初始化直播相关的UI、开始录制、显示通知等
  console.log('[plugin] 直播开始:', ctx);
  return { ok: true };
}

/**
 * 直播结束事件
 * @param {Object} ctx - 事件上下文
 * @param {string} ctx.roomId - 房间ID
 * @param {number} ctx.duration - 直播时长（秒）
 * @param {number} ctx.timestamp - 事件时间戳
 */
async function onLiveStop(ctx = {}) {
  // 处理直播结束事件
  // 可以在这里清理直播相关的资源、保存统计数据等
  console.log('[plugin] 直播结束:', ctx);
  return { ok: true };
}

/**
 * 弹幕接收事件
 * @param {Object} ctx - 弹幕上下文
 * @param {string} ctx.id - 弹幕ID
 * @param {string} ctx.roomId - 房间ID
 * @param {string} ctx.userId - 用户ID
 * @param {string} ctx.userName - 用户名称
 * @param {string} ctx.content - 弹幕内容
 * @param {number} ctx.timestamp - 发送时间戳
 * @param {string} ctx.userBadge - 用户徽章
 * @param {number} ctx.userLevel - 用户等级
 */
async function onDanmuReceived(ctx = {}) {
  // 处理弹幕事件
  // 可以在这里显示弹幕、过滤内容、统计弹幕数量等
  console.log('[plugin] 收到弹幕:', ctx.content, '来自:', ctx.userName);
  return { ok: true };
}

/**
 * 礼物接收事件
 * @param {Object} ctx - 礼物上下文
 * @param {string} ctx.id - 礼物ID
 * @param {string} ctx.roomId - 房间ID
 * @param {string} ctx.userId - 赠送用户ID
 * @param {string} ctx.userName - 赠送用户名称
 * @param {string} ctx.giftId - 礼物ID
 * @param {string} ctx.giftName - 礼物名称
 * @param {number} ctx.giftCount - 礼物数量
 * @param {number} ctx.giftValue - 礼物价值（元）
 * @param {number} ctx.timestamp - 赠送时间戳
 */
async function onGiftReceived(ctx = {}) {
  // 处理礼物事件
  // 可以在这里显示礼物特效、统计礼物收入、播放音效等
  console.log('[plugin] 收到礼物:', ctx.giftName, 'x', ctx.giftCount, '来自:', ctx.userName);
  return { ok: true };
}

/**
 * 点赞接收事件
 * @param {Object} ctx - 点赞上下文
 * @param {string} ctx.id - 点赞ID
 * @param {string} ctx.roomId - 房间ID
 * @param {string} ctx.userId - 用户ID
 * @param {string} ctx.userName - 用户名称
 * @param {number} ctx.count - 点赞数量
 * @param {number} ctx.timestamp - 时间戳
 */
async function onLikeReceived(ctx = {}) {
  // 处理点赞事件
  // 可以在这里显示点赞动画、统计点赞数等
  console.log('[plugin] 收到点赞:', ctx.count, '来自:', ctx.userName);
  return { ok: true };
}

/**
 * 观众进入房间事件
 * @param {Object} ctx - 进入上下文
 * @param {string} ctx.userId - 用户ID
 * @param {string} ctx.userName - 用户名称
 * @param {string} ctx.roomId - 房间ID
 * @param {number} ctx.timestamp - 进入时间戳
 * @param {boolean} ctx.isNewUser - 是否新用户
 */
async function onAudienceEnter(ctx = {}) {
  // 处理观众进入事件
  // 可以在这里显示欢迎消息、统计在线人数等
  console.log('[plugin] 观众进入:', ctx.userName);
  return { ok: true };
}

/**
 * 关注事件
 * @param {Object} ctx - 关注上下文
 * @param {string} ctx.followerId - 关注者ID
 * @param {string} ctx.followerName - 关注者名称
 * @param {string} ctx.streamerId - 主播ID
 * @param {string} ctx.streamerName - 主播名称
 * @param {number} ctx.timestamp - 关注时间戳
 */
async function onFollow(ctx = {}) {
  // 处理关注事件
  // 可以在这里显示关注感谢、统计关注数等
  console.log('[plugin] 新关注:', ctx.followerName, '关注了', ctx.streamerName);
  return { ok: true };
}

/**
 * 分享直播事件
 * @param {Object} ctx - 分享上下文
 * @param {string} ctx.shareId - 分享ID
 * @param {string} ctx.userId - 分享用户ID
 * @param {string} ctx.userName - 分享用户名称
 * @param {string} ctx.platform - 分享平台
 * @param {number} ctx.timestamp - 分享时间戳
 */
async function onShareLive(ctx = {}) {
  // 处理分享事件
  // 可以在这里统计分享数据、激励分享行为等
  console.log('[plugin] 直播被分享:', ctx.userName, '分享到', ctx.platform);
  return { ok: true };
}

// ===== 用户认证事件 =====

/**
 * 用户登录事件
 * @param {Object} ctx - 登录上下文
 * @param {string} ctx.userId - 用户ID
 * @param {string} ctx.userName - 用户名称
 * @param {string} ctx.token - 登录令牌
 * @param {number} ctx.timestamp - 登录时间戳
 */
async function onUserLogin(ctx = {}) {
  // 处理用户登录事件
  // 可以在这里初始化用户相关的功能、加载用户配置等
  console.log('[plugin] 用户登录:', ctx.userName);
  return { ok: true };
}

/**
 * 用户登出事件
 * @param {Object} ctx - 登出上下文
 * @param {string} ctx.userId - 用户ID
 * @param {string} ctx.userName - 用户名称
 * @param {number} ctx.timestamp - 登出时间戳
 * @param {string} ctx.reason - 登出原因
 */
async function onUserLogout(ctx = {}) {
  // 处理用户登出事件
  // 可以在这里清理用户相关的资源、保存用户状态等
  console.log('[plugin] 用户登出:', ctx.userName, '原因:', ctx.reason);
  return { ok: true };
}

// ===== 房间管理事件 =====

/**
 * 房间添加事件
 * @param {Object} ctx - 房间上下文
 * @param {string} ctx.roomId - 房间ID
 * @param {string} ctx.streamerName - 主播名称
 * @param {string} ctx.roomTitle - 房间标题
 * @param {number} ctx.timestamp - 添加时间戳
 */
async function onRoomAdded(ctx = {}) {
  // 处理房间添加事件
  // 可以在这里初始化房间相关的UI、开始监控房间状态等
  console.log('[plugin] 房间添加:', ctx.roomId, '主播:', ctx.streamerName);
  return { ok: true };
}

/**
 * 房间移除事件
 * @param {Object} ctx - 房间上下文
 * @param {string} ctx.roomId - 房间ID
 * @param {string} ctx.reason - 移除原因
 * @param {number} ctx.timestamp - 移除时间戳
 */
async function onRoomRemoved(ctx = {}) {
  // 处理房间移除事件
  // 可以在这里清理房间相关的资源、停止监控等
  console.log('[plugin] 房间移除:', ctx.roomId, '原因:', ctx.reason);
  return { ok: true };
}

/**
 * 房间状态变化事件
 * @param {Object} ctx - 状态上下文
 * @param {string} ctx.roomId - 房间ID
 * @param {string} ctx.oldStatus - 旧状态
 * @param {string} ctx.newStatus - 新状态
 * @param {number} ctx.timestamp - 变化时间戳
 */
async function onRoomStatusChange(ctx = {}) {
  // 处理房间状态变化
  // 状态可能包括: connecting, connected, disconnected, error, closed
  console.log('[plugin] 房间状态变化:', ctx.roomId, ctx.oldStatus, '->', ctx.newStatus);
  return { ok: true };
}

// ===== 插件生命周期事件 =====

/**
 * 插件即将启用
 * 在插件被启用前调用，可以进行准备工作
 * @param {Object} ctx - 生命周期上下文
 * @param {string} ctx.pluginId - 插件ID
 * @param {Object} ctx.manifest - 插件清单
 * @param {number} ctx.timestamp - 时间戳
 */
async function onBeforeEnable(ctx = {}) {
  // 插件启用前的准备工作
  console.log('[plugin] 即将启用:', ctx.pluginId);
  return { ok: true };
}

/**
 * 插件已启用
 * 在插件启用后调用，可以开始主要功能
 * @param {Object} ctx - 生命周期上下文
 */
async function onAfterEnable(ctx = {}) {
  // 插件启用后的初始化工作
  console.log('[plugin] 已启用:', ctx.pluginId);
  return { ok: true };
}

/**
 * 插件即将禁用
 * 在插件被禁用前调用，可以进行清理工作
 * @param {Object} ctx - 生命周期上下文
 */
async function onBeforeDisable(ctx = {}) {
  // 插件禁用前的清理工作
  console.log('[plugin] 即将禁用:', ctx.pluginId);
  return { ok: true };
}

/**
 * 插件已禁用
 * 在插件禁用后调用
 * @param {Object} ctx - 生命周期上下文
 */
async function onAfterDisable(ctx = {}) {
  // 插件禁用后的收尾工作
  console.log('[plugin] 已禁用:', ctx.pluginId);
  return { ok: true };
}

/**
 * UI页面即将打开
 * @param {Object} ctx - 页面上下文
 * @param {string} ctx.pluginId - 插件ID
 * @param {string} ctx.pageType - 页面类型 (ui/window/overlay)
 * @param {string} ctx.pageId - 页面ID
 * @param {number} ctx.timestamp - 时间戳
 */
async function onBeforeUiOpen(ctx = {}) {
  // UI页面打开前的准备工作
  console.log('[plugin] UI即将打开:', ctx.pageType, ctx.pageId);
  return { ok: true };
}

/**
 * UI页面已打开
 * @param {Object} ctx - 页面上下文
 */
async function onAfterUiOpen(ctx = {}) {
  // UI页面打开后的初始化工作
  console.log('[plugin] UI已打开:', ctx.pageType, ctx.pageId);
  return { ok: true };
}

/**
 * UI页面已关闭
 * @param {Object} ctx - 页面上下文
 * @param {string} ctx.reason - 关闭原因
 */
async function onUiClosed(ctx = {}) {
  // UI页面关闭后的清理工作
  console.log('[plugin] UI已关闭:', ctx.pageType, '原因:', ctx.reason);
  return { ok: true };
}

/**
 * 窗口即将打开
 * @param {Object} ctx - 窗口上下文
 * @param {string} ctx.pluginId - 插件ID
 * @param {string} ctx.windowId - 窗口ID
 * @param {Object} ctx.windowOptions - 窗口选项
 * @param {number} ctx.timestamp - 时间戳
 */
async function onBeforeWindowOpen(ctx = {}) {
  // 窗口打开前的准备工作
  console.log('[plugin] 窗口即将打开:', ctx.windowId);
  return { ok: true };
}

/**
 * 窗口已打开
 * @param {Object} ctx - 窗口上下文
 */
async function onAfterWindowOpen(ctx = {}) {
  // 窗口打开后的初始化工作
  console.log('[plugin] 窗口已打开:', ctx.windowId);
  return { ok: true };
}

/**
 * 窗口已关闭
 * @param {Object} ctx - 窗口上下文
 */
async function onWindowClosed(ctx = {}) {
  // 窗口关闭后的清理工作
  console.log('[plugin] 窗口已关闭:', ctx.windowId);
  return { ok: true };
}

/**
 * 叠加层即将打开
 * @param {Object} ctx - 叠加层上下文
 * @param {string} ctx.pluginId - 插件ID
 * @param {string} ctx.overlayId - 叠加层ID
 * @param {Object} ctx.overlayOptions - 叠加层选项
 * @param {number} ctx.timestamp - 时间戳
 */
async function onBeforeOverlayOpen(ctx = {}) {
  // 叠加层打开前的准备工作
  console.log('[plugin] 叠加层即将打开:', ctx.overlayId);
  return { ok: true };
}

/**
 * 叠加层已打开
 * @param {Object} ctx - 叠加层上下文
 */
async function onAfterOverlayOpen(ctx = {}) {
  // 叠加层打开后的初始化工作
  console.log('[plugin] 叠加层已打开:', ctx.overlayId);
  return { ok: true };
}

/**
 * 叠加层已关闭
 * @param {Object} ctx - 叠加层上下文
 */
async function onOverlayClosed(ctx = {}) {
  // 叠加层关闭后的清理工作
  console.log('[plugin] 叠加层已关闭:', ctx.overlayId);
  return { ok: true };
}

// ===== 系统事件 =====

/**
 * SSE连接已建立
 * Server-Sent Events连接成功时触发
 * @param {Object} ctx - 连接上下文
 * @param {string} ctx.endpoint - 连接端点
 * @param {number} ctx.timestamp - 连接时间戳
 */
async function onSseConnected(ctx = {}) {
  // 处理SSE连接事件
  console.log('[plugin] SSE已连接:', ctx.endpoint);
  return { ok: true };
}

/**
 * SSE连接已断开
 * @param {Object} ctx - 断开上下文
 * @param {string} ctx.endpoint - 原连接端点
 * @param {string} ctx.reason - 断开原因
 * @param {number} ctx.timestamp - 断开时间戳
 */
async function onSseDisconnected(ctx = {}) {
  // 处理SSE断开事件
  console.log('[plugin] SSE已断开:', ctx.endpoint, '原因:', ctx.reason);
  return { ok: true };
}

/**
 * 配置更新事件
 * 插件配置发生变化时触发
 * @param {Object} ctx - 配置上下文
 * @param {Object} ctx.oldConfig - 旧配置
 * @param {Object} ctx.newConfig - 新配置
 * @param {number} ctx.timestamp - 更新时间戳
 */
async function onConfigUpdated(ctx = {}) {
  // 处理配置更新事件
  console.log('[plugin] 配置已更新');
  return { ok: true };
}

/**
 * 错误处理事件
 * 插件运行过程中发生错误时触发
 * @param {Object} ctx - 错误上下文
 * @param {string} ctx.errorType - 错误类型
 * @param {string} ctx.errorMessage - 错误消息
 * @param {Object} ctx.errorStack - 错误堆栈
 * @param {number} ctx.timestamp - 错误时间戳
 */
async function onError(ctx = {}) {
  // 处理错误事件
  console.error('[plugin] 发生错误:', ctx.errorType, ctx.errorMessage);
  return { ok: true };
}

/**
 * 警告事件
 * 插件运行过程中出现警告时触发
 * @param {Object} ctx - 警告上下文
 * @param {string} ctx.warningType - 警告类型
 * @param {string} ctx.warningMessage - 警告消息
 * @param {number} ctx.timestamp - 警告时间戳
 */
async function onWarning(ctx = {}) {
  // 处理警告事件
  console.warn('[plugin] 发生警告:', ctx.warningType, ctx.warningMessage);
  return { ok: true };
}

// ===== 插件导出 =====

module.exports = {
  // 基础功能
  init,
  cleanup,
  handleMessage,
  
  // 直播事件
  onLiveStart,
  onLiveStop,
  onDanmuReceived,
  onGiftReceived,
  onLikeReceived,
  onAudienceEnter,
  onFollow,
  onShareLive,
  
  // 用户认证事件
  onUserLogin,
  onUserLogout,
  
  // 房间管理事件
  onRoomAdded,
  onRoomRemoved,
  onRoomStatusChange,
  
  // 插件生命周期事件
  onBeforeEnable,
  onAfterEnable,
  onBeforeDisable,
  onAfterDisable,
  onBeforeUiOpen,
  onAfterUiOpen,
  onUiClosed,
  onBeforeWindowOpen,
  onAfterWindowOpen,
  onWindowClosed,
  onBeforeOverlayOpen,
  onAfterOverlayOpen,
  onOverlayClosed,
  
  // 系统事件
  onSseConnected,
  onSseDisconnected,
  onConfigUpdated,
  onError,
  onWarning
};