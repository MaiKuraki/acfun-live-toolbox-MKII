/**
 * AcFun 弹幕事件类型定义
 *
 * 基于 acfunlive-http-api 的类型定义，适配插件开发使用
 * 参考: node_modules/.pnpm/acfunlive-http-api/.../dist/types/index.d.ts
 */

// ==================== 标准化事件类型 ====================

/**
 * 标准化事件类型枚举
 */
export type NormalizedEventType =
  | 'danmaku' | 'gift' | 'follow' | 'like' | 'enter' | 'system'
  | 'shareLive' | 'richText' | 'recentComment'
  | 'bananaCount' | 'displayInfo' | 'topUsers' | 'redpackList'
  | 'chatCall' | 'chatAccept' | 'chatReady' | 'chatEnd'
  | 'joinClub'
  | 'kickedOut' | 'violationAlert' | 'managerState' | 'end';

/**
 * 标准化事件接口
 * 所有事件从适配器、存储到数据库、通过API广播都符合此接口
 */
export interface NormalizedEvent {
  ts: number;                 // 毫秒级时间戳（事件发生时间）
  received_at: number;        // 毫秒级时间戳（适配器接收时间）
  room_id: string;            // 房间ID
  live_id?: string;           // 直播ID（可选）
  source: string;             // 数据源标识（如 'acfun'）
  event_type: NormalizedEventType;  // 事件类型
  user_id?: string | null;    // 用户ID（可选）
  user_name?: string | null;  // 用户名（可选）
  content?: string | null;    // 事件内容（可选）
  raw: DanmuMessageRaw;       // 弹幕消息原始数据
}

// ==================== 基础类型 ====================

/**
 * 弹幕事件类型的完整数据结构定义
 * 以下是为 subscribeDanmaku callback 接收的 NormalizedEvent.raw 字段定义的完整结构
 * 所有事件类型都基于 DanmuMessageRaw，但具有不同的具体数据字段
 */

// ==================== 弹幕事件完整数据结构 ====================

/**
 * 弹幕消息的完整数据结构
 */
export interface DanmakuEventData extends DanmuMessageRaw {
  // 弹幕消息特有的额外字段
  content: string;  // 弹幕文本内容（必需）
}

/**
 * 礼物事件的完整数据结构
 */
export interface GiftEventData extends DanmuMessageRaw {
  // 礼物信息
  giftDetail: GiftDetail;
  count: number;      // 礼物数量
  combo: number;      // 连击数
  value: number;      // 礼物价值
  comboID: string;    // 连击ID
  slotDisplayDuration: number;  // 插槽显示时长
  expireDuration: number;       // 过期时长
  drawGiftInfo?: DrawGiftInfo;  // 绘制礼物信息（可选）
}

/**
 * 关注事件的完整数据结构
 */
export interface FollowEventData extends DanmuMessageRaw {
  // 关注事件通常只有基础字段，无额外数据
}

/**
 * 点赞事件的完整数据结构
 */
export interface LikeEventData extends DanmuMessageRaw {
  // 点赞事件通常只有基础字段，无额外数据
  // 但可能包含点赞相关的统计信息
  likeCount?: number;    // 点赞总数
  likeDelta?: number;    // 点赞增量
}

/**
 * 进入房间事件的完整数据结构
 */
export interface EnterEventData extends DanmuMessageRaw {
  // 进入房间事件通常只有基础字段，无额外数据
}

/**
 * 分享直播事件的完整数据结构
 */
export interface ShareLiveEventData extends DanmuMessageRaw {
  // 分享平台信息
  sharePlatform: SharePlatformType;  // 分享平台类型
  sharePlatformIcon: string;         // 分享平台图标
}

/**
 * 加入粉丝团事件的完整数据结构
 */
export interface JoinClubEventData extends DanmuMessageRaw {
  // 粉丝团信息
  joinTime: number;        // 加入时间
  fansInfo: UserInfo;      // 粉丝信息
  uperInfo: UserInfo;      // UP主信息
}

/**
 * 富文本事件的完整数据结构
 */
export interface RichTextEventData extends DanmuMessageRaw {
  // 富文本段落列表
  segments: RichTextSegment[];
}

/**
 * 弹幕事件数据联合类型
 * 涵盖所有支持的事件类型
 */
export type DanmuEventDataUnion =
  | DanmakuEventData
  | GiftEventData
  | FollowEventData
  | LikeEventData
  | EnterEventData
  | ShareLiveEventData
  | JoinClubEventData
  | RichTextEventData;

/**
 * 弹幕消息基础接口
 */
export interface DanmuMessage {
  sendTime: number;
  userInfo: UserInfo;
}

// ==================== 辅助类型 ====================

/**
 * 用户信息
 */
export interface UserInfo {
  userID: number;
  nickname: string;
  avatar: string;
  medal: MedalInfo;
  managerType: ManagerType;
}

/**
 * 粉丝牌信息
 */
export interface MedalInfo {
  uperID: number;
  userID: number;
  clubName: string;
  level: number;
}

/**
 * 房管类型枚举
 */
export enum ManagerType {
  NotManager = 0,
  NormalManager = 1,
}

// ==================== 具体事件类型 ====================

/**
 * 评论/弹幕消息
 */
export interface Comment extends DanmuMessage {
  content: string;
}

/**
 * 点赞消息
 */
export interface Like extends DanmuMessage {
  // 无额外字段
}

/**
 * 进入房间消息
 */
export interface EnterRoom extends DanmuMessage {
  // 无额外字段
}

/**
 * 关注主播消息
 */
export interface FollowAuthor extends DanmuMessage {
  // 无额外字段
}

/**
 * 投蕉消息
 */
export interface ThrowBanana extends DanmuMessage {
  bananaCount: number;
}

/**
 * 礼物详细信息
 */
export interface GiftDetail {
  giftID: number;
  giftName: string;
  arLiveName: string;
  payWalletType: number;
  price: number;
  webpPic: string;
  pngPic: string;
  smallPngPic: string;
  allowBatchSendSizeList: number[];
  canCombo: boolean;
  canDraw: boolean;
  magicFaceID: number;
  vupArID: number;
  description: string;
  redpackPrice: number;
  cornerMarkerText: string;
}

/**
 * 礼物消息
 */
export interface Gift extends DanmuMessage {
  giftDetail: GiftDetail;
  count: number;
  combo: number;
  value: number;
  comboID: string;
  slotDisplayDuration: number;
  expireDuration: number;
  drawGiftInfo?: DrawGiftInfo;
}

/**
 * 绘制礼物信息
 */
export interface DrawGiftInfo {
  screenWidth: number;
  screenHeight: number;
  drawPoint: DrawPoint[];
}

/**
 * 绘制点信息
 */
export interface DrawPoint {
  marginLeft: number;
  marginTop: number;
  scaleRatio: number;
  handup: boolean;
  pointWidth: number;
  pointHeight: number;
}

/**
 * 富文本段落类型
 */
export type RichTextSegment = RichTextUserInfo | RichTextPlain | RichTextImage;

/**
 * 富文本用户信息段落
 */
export interface RichTextUserInfo {
  type: 'userInfo';
  userInfo: UserInfo;
  color: string;
}

/**
 * 富文本纯文本段落
 */
export interface RichTextPlain {
  type: 'plain';
  text: string;
  color: string;
}

/**
 * 富文本图片段落
 */
export interface RichTextImage {
  type: 'image';
  pictures: string[];
  alternativeText: string;
  alternativeColor: string;
}

/**
 * 富文本消息
 */
export interface RichText extends DanmuMessage {
  segments: RichTextSegment[];
}

/**
 * 加入粉丝团消息
 */
export interface JoinClub extends DanmuMessage {
  joinTime: number;
  fansInfo: UserInfo;
  uperInfo: UserInfo;
}

/**
 * 分享平台类型枚举
 */
export enum SharePlatformType {
  PlatformUnknown = 0,
  PlatformQQ = 1,
  PlatformQzone = 2,
  PlatformWeibo = 3,
  PlatformWeChat = 4,
  PlatformWeChatMoments = 5,
  PlatformAcFunMoment = 6,
}

/**
 * 分享直播消息
 */
export interface ShareLive extends DanmuMessage {
  sharePlatform: SharePlatformType;
  sharePlatformIcon: string;
}

// ==================== 类型汇总 ====================

/**
 * 弹幕事件类型字符串字面量
 */
export type DanmuEventType =
  | 'comment'
  | 'like'
  | 'enter_room'
  | 'follow'
  | 'throw_banana'
  | 'gift'
  | 'rich_text'
  | 'join_club'
  | 'share_live'
  | 'manager_state';

/**
 * 所有弹幕消息类型的联合类型
 */
export type DanmuMessageUnion =
  | Comment
  | Like
  | EnterRoom
  | FollowAuthor
  | ThrowBanana
  | Gift
  | RichText
  | JoinClub
  | ShareLive;

/**
 * 弹幕信息结构
 */
export interface DanmuInfo {
  sendTime: number;           // 发送时间
  userInfo: UserInfo;         // 用户信息
}

/**
 * 弹幕事件原始数据结构
 * 所有弹幕相关事件的 raw 字段都遵循此结构
 */
export interface DanmuMessageRaw {
  sendTime: number;           // 发送时间
  userInfo: UserInfo;         // 用户信息
  actionType: string;         // 动作类型（如 'like', 'gift', 'comment' 等）
  danmuInfo: DanmuInfo;       // 弹幕信息
  signalType: string;         // 信号类型
  parentType: string;         // 父类型
  timestamp: number;          // 时间戳
  userId: number;             // 用户ID（数字格式）
  content: string | null;     // 内容（可能为null）
  raw: DanmuRawNested;        // 原始嵌套数据（简化版原始数据）
}

/**
 * 弹幕原始嵌套数据结构
 * 包含简化版的原始数据，通常只包含核心字段
 */
export interface DanmuRawNested {
  actionType: string;         // 动作类型
  danmuInfo: DanmuInfo;       // 弹幕信息
}