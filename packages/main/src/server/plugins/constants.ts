export const allowedDanmakuTypes = [
  "danmaku", "gift", "follow", "like", "enter", "system",
  "shareLive", "richText", "recentComment",
  "bananaCount", "displayInfo", "topUsers", "redpackList",
  "chatCall", "chatAccept", "chatReady", "chatEnd",
  "joinClub",
  "kickedOut", "violationAlert", "managerState", "end",
];

export const allowedDanmakuLower = new Set(allowedDanmakuTypes.map((x) => x.toLowerCase()));

export const rendererAllowedEvents = [
  "user-login",
  "user-logout",
  "route-change",
  "live-start",
  "live-stop",
  "danmaku-collection-start",
  "danmaku-collection-stop",
  "config-updated",
  "plugin-enabled",
  "plugin-disabled",
  "plugin-uninstalled",
  "app-closing",
];

export const messageAllowedKinds = ["mainMessage", "uiMessage", "message"];












