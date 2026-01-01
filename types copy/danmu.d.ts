/**
 * AcFun 弹幕事件类型定义
 *
 * 基于 acfunlive-http-api 的类型定义，适配插件开发使用
 * 参考: node_modules/.pnpm/acfunlive-http-api/.../dist/types/index.d.ts
 */

// ==================== 基础类型 ====================

/**
 * 弹幕事件基础接口
 */
export interface DanmuEvent {
  type: string;
  data: any;
  timestamp: number;
  userId: string;
  userName: string;
}

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
