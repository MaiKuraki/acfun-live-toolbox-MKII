import type { NormalizedEvent, NormalizedEventType } from '../types';

const ALLOWED_TYPES: NormalizedEventType[] = [
  'danmaku','gift','follow','like','enter','system',
  'shareLive','richText','recentComment',
  'bananaCount','displayInfo','topUsers','redpackList',
  'chatCall','chatAccept','chatReady','chatEnd',
  'joinClub',
  'kickedOut','violationAlert','managerState','end'
];

// 事件验证规则
interface ValidationRule {
  name: string;
  validate: (event: NormalizedEvent) => boolean;
  errorMessage: string;
}

// 事件过滤器接口
export interface EventFilter {
  name: string;
  filter: (event: NormalizedEvent) => boolean;
  description: string;
}

// 预定义的验证规则
const VALIDATION_RULES: ValidationRule[] = [
  {
    name: 'timestamp_valid',
    validate: (event) => {
      const now = Date.now();
      const ts = Number(event.ts);
      // 时间戳应该在合理范围内（过去24小时到未来1小时）
      return ts > (now - 24 * 60 * 60 * 1000) && ts < (now + 60 * 60 * 1000);
    },
    errorMessage: 'Event timestamp is outside valid range'
  },
  {
    name: 'room_id_valid',
    validate: (event) => {
      return typeof event.room_id === 'string' && event.room_id.length > 0 && event.room_id.length <= 128;
    },
    errorMessage: 'Room ID is invalid or too long'
  },
  {
    name: 'source_valid',
    validate: (event) => {
      const validSources = ['acfun', 'bilibili', 'douyu', 'huya', 'unknown'];
      return validSources.includes(event.source);
    },
    errorMessage: 'Event source is not recognized'
  },
  {
    name: 'user_info_consistent',
    validate: (event) => {
      // 如果有用户ID，应该也有用户名（除非是系统事件）
      if (event.event_type === 'system') return true;
      if (event.user_id && !event.user_name) return false;
      return true;
    },
    errorMessage: 'User information is inconsistent'
  },
  {
    name: 'content_appropriate',
    validate: (event) => {
      if (!event.content) return true;
      // 检查内容长度和基本格式
      if (event.content.length > 1000) return false;
      // 检查是否包含过多的重复字符
      const repeatedPattern = /(.)\1{20,}/;
      return !repeatedPattern.test(event.content);
    },
    errorMessage: 'Event content is inappropriate or too long'
  }
];

// 预定义的过滤器
const DEFAULT_FILTERS: EventFilter[] = [];

function clampType(t: any): NormalizedEventType {
  const s = String(t || '').toLowerCase();
  const mapped =
    s === 'comment' ? 'danmaku' :
    s === 'danmaku' ? 'danmaku' :
    s === 'gift' ? 'gift' :
    s === 'follow' ? 'follow' :
    s === 'like' ? 'like' :
    s === 'enter' ? 'enter' :
    s === 'bananacount' ? 'bananaCount' :
    s === 'displayinfo' ? 'displayInfo' :
    s === 'topusers' ? 'topUsers' :
    s === 'redpacklist' ? 'redpackList' :
    s === 'sharelive' ? 'shareLive' :
    s === 'richtext' ? 'richText' :
    s === 'recentcomment' ? 'recentComment' :
    s === 'chatcall' ? 'chatCall' :
    s === 'chataccept' ? 'chatAccept' :
    s === 'chatready' ? 'chatReady' :
    s === 'chatend' ? 'chatEnd' :
    s === 'joinclub' ? 'joinClub' :
    s === 'kickedout' ? 'kickedOut' :
    s === 'violationalert' ? 'violationAlert' :
    s === 'managerstate' ? 'managerState' :
    s === 'end' ? 'end' : 'system';
  return (ALLOWED_TYPES as string[]).includes(mapped) ? (mapped as NormalizedEventType) : 'system';
}

function sanitizeText(input: any, maxLen = 500): string | null {
  if (input == null) return null;
  let s = String(input);
  // 去除控制字符与多余空白
  s = s.replace(/[\u0000-\u001F\u007F]/g, '').trim();
  if (!s) return null;
  if (s.length > maxLen) s = s.slice(0, maxLen);
  return s;
}

/**
 * 验证事件是否符合规范
 */
export function validateEvent(event: NormalizedEvent, rules: ValidationRule[] = VALIDATION_RULES): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const rule of rules) {
    try {
      if (!rule.validate(event)) {
        errors.push(`${rule.name}: ${rule.errorMessage}`);
      }
    } catch (error) {
      errors.push(`${rule.name}: Validation rule failed with error: ${error}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 应用事件过滤器
 */
export function applyFilters(event: NormalizedEvent, filters: EventFilter[] = DEFAULT_FILTERS): { passed: boolean; failedFilters: string[] } {
  return { passed: true, failedFilters: [] };
}

/**
 * 获取事件质量评分 (0-100)
 */
export function getEventQualityScore(event: NormalizedEvent): number {
  let score = 100;
  
  // 检查必需字段的完整性
  if (!event.room_id) score -= 20;
  if (!event.user_id && event.event_type !== 'system') score -= 15;
  if (!event.user_name && event.event_type !== 'system') score -= 10;
  if (!event.content && event.event_type === 'danmaku') score -= 25;
  
  // 检查时间戳的合理性
  const now = Date.now();
  const timeDiff = Math.abs(now - event.ts);
  if (timeDiff > 60 * 1000) score -= 5; // 超过1分钟的延迟
  if (timeDiff > 5 * 60 * 1000) score -= 10; // 超过5分钟的延迟
  
  // 检查内容质量
  if (event.content) {
    const contentLength = event.content.length;
    if (contentLength < 2) score -= 5; // 内容过短
    if (contentLength > 200) score -= 5; // 内容过长
    
    // 检查重复字符
    const repeatedPattern = /(.)\1{5,}/;
    if (repeatedPattern.test(event.content)) score -= 10;
  }
  
  // 检查原始数据的存在
  if (!event.raw) score -= 5;
  
  return Math.max(0, Math.min(100, score));
}

export function ensureNormalized(event: NormalizedEvent): NormalizedEvent {
  const tsRaw = Number(event.ts ?? Date.now());
  const safeTs = Number.isFinite(tsRaw) ? tsRaw : Date.now();
  
  const receivedAtRaw = Number(event.received_at ?? Date.now());
  const safeReceivedAt = Number.isFinite(receivedAtRaw) ? receivedAtRaw : Date.now();

  const normalized: NormalizedEvent = {
    ts: safeTs,
    received_at: safeReceivedAt,
    room_id: sanitizeText(event.room_id, 128) || String(event.room_id || ''),
    source: sanitizeText(event.source, 64) || 'unknown',
    event_type: clampType(event.event_type),
    user_id: sanitizeText(event.user_id, 128),
    user_name: sanitizeText(event.user_name, 128),
    content: sanitizeText(event.content, 500),
    raw: event.raw ?? null
  };

  // 验证标准化后的事件
  const validation = validateEvent(normalized);
  if (!validation.isValid) {
    console.warn('[EventNormalizer] Event validation failed:', validation.errors, normalized);
  }

  return normalized;
}

// 导出默认过滤器和验证规则，供其他模块使用
export { DEFAULT_FILTERS, VALIDATION_RULES };
