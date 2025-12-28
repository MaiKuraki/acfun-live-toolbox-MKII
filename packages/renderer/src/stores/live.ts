import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'
import { useAccountStore } from './account'
import { useRoomStore } from './room'
import type { RoomStatusEventPayload } from '../types/events'
import { getApiBase } from '../utils/hosting'
import { normalizeAvatarUrl } from '../utils/url'

interface User {
  userID: number;
  nickname: string;
  avatar: string;
  isManager: boolean;
  badge?: { clubName: string; level: number };
  giftCount: number;
  likeCount: number;
  bananaCount: number;
}

interface LiveStats {
  onlineCount: number;
  likeCount: number;
  giftCount: number;
  bananaCount: number;
}

export const useLiveStore = defineStore('live', () => {
  const liveId = ref<string | null>(null)
  const isLive = ref<boolean>(false)
  const liveInfo = reactive<{ title: string; cover: string; startTime: number }>({ title: '', cover: '', startTime: 0 })
  const stats = reactive<LiveStats>({ onlineCount: 0, likeCount: 0, giftCount: 0, bananaCount: 0 })
  const refreshTimer = ref<NodeJS.Timeout | null>(null)
  const giftMap = reactive<Record<string, { userID: number; nickname: string; avatar: string; value: number; count: number }>>({})
  const giftMapByRoom = reactive<Record<string, Record<string, { userID: number; nickname: string; avatar: string; value: number; count: number }>>>({})
  const audienceByRoom = reactive<Record<string, User[]>>({})
  const messagesByRoom = reactive<Record<string, any[]>>({})
  const statsByRoom = reactive<Record<string, LiveStats>>({})
  const watchlistGlobalTimer = ref<number | null>(null)
  let subscribed = false
  const loadedRoomsHistory = new Set<string>()
  const messageIdsByRoom: Record<string, Set<string>> = {}
  const firstEventTsByRoom: Record<string, number> = {}

  let messageSeq = 0

  function makeMessageId(roomId: string, type: string, data: any, ts: number): string {
    const uid = String((data?.userId ?? data?.userInfo?.userID ?? ''))
    const seq = messageSeq++
    return `${roomId}:${type}:${uid}:${ts}:${seq}`
  }

  function setLiveStarted(id: string, details?: { title?: string; cover?: string; startTime?: number }) {
    liveId.value = String(id)
    isLive.value = true
    if (details) {
      if (typeof details.title === 'string') liveInfo.title = details.title
      if (typeof details.cover === 'string') liveInfo.cover = details.cover
      if (typeof details.startTime === 'number') liveInfo.startTime = details.startTime
    }
  }

  async function ensureLiveId() {
    try {
      if (isLive.value) {
        return
      }
      const account = useAccountStore()
      const uid = account?.userInfo?.userID ? String(account.userInfo.userID) : ''
      let connected = false
      try {
        if ((window as any).electronApi?.room?.status && uid) {
          const st = await (window as any).electronApi?.room.status(uid)
          connected = st && typeof st.status === 'string' ? st.status === 'connected' : false
        } else {
          const base = getApiBase()
          const url = new URL('/api/acfun/danmu/connection-state', base)
          const r = await fetch(url.toString(), { method: 'GET' })
          const cs = await r.json()
          connected = !!(cs && cs.success && cs.data && cs.data.connected === true)
        }
      } catch {}

      if (connected) {
        isLive.value = true
        return
      }

      const base = getApiBase()
      const r = await fetch(new URL('/api/acfun/live/stream-status', base).toString(), { method: 'GET' })
      const res = await r.json()
      if (res && res.success && res.data) {
        const ld = String(res.data.liveID || '')
        isLive.value = !!ld
        if (ld && !liveId.value) {
          liveId.value = ld
        }
        if (typeof res.data.title === 'string') liveInfo.title = res.data.title || liveInfo.title
        if (typeof res.data.liveCover === 'string') liveInfo.cover = res.data.liveCover || liveInfo.cover
        if (typeof res.data.liveStartTime === 'number') liveInfo.startTime = res.data.liveStartTime
      } else {
        // 请求失败或无数据时，不覆盖当前开播状态
      }
    } catch {
      // 网络/其它异常时不覆盖当前开播状态
    }
  }

  async function loadAudience() {
    try {
      const account = useAccountStore()
      const currentLiveId = liveId.value
      if (currentLiveId) {
        const urlWatch = new URL('/api/acfun/live/watching-list', getApiBase())
        urlWatch.searchParams.set('liveId', String(currentLiveId))
        const res = await fetch(urlWatch.toString(), { method: 'GET' })
        const data = await res.json()
        if (data && data.success && Array.isArray(data.data)) {
          const mapped = data.data.map((w: any) => ({
            userID: Number(w.userInfo?.userID || 0),
            nickname: String(w.userInfo?.nickname || ''),
            avatar: normalizeAvatarUrl(String(w.userInfo?.avatar || '')),
            isManager: Number(w.userInfo?.managerType || 0) === 1,
            badge: w.userInfo?.medal ? { clubName: String(w.userInfo.medal.clubName || ''), level: Number(w.userInfo.medal.level || 0) } : undefined,
            giftCount: 0,
            likeCount: 0,
            bananaCount: 0
          }))
          audienceByRoom[String(currentLiveId)] = mapped
          const roomKey = String(currentLiveId)
          const roomMap = giftMapByRoom[roomKey] || (giftMapByRoom[roomKey] = {})
          for (const w of data.data) {
            const uid = Number(w?.userInfo?.userID || 0)
            const name = String(w?.userInfo?.nickname || '')
            const avatar = normalizeAvatarUrl(String(w?.userInfo?.avatar || ''))
            const raw = String(w?.displaySendAmount || '')
            const val = Number(raw.replace(/[^\d.]/g, '')) || 0
            const key = String(uid || name || Math.random())
            const prev = roomMap[key]
            if (prev) {
              prev.value = Math.max(prev.value, val)
            } else {
              roomMap[key] = { userID: uid, nickname: name, avatar, value: val, count: 0 }
            }
          }
        } else {
          audienceByRoom[String(currentLiveId)] = []
        }
      } else {
        // 无主房间ID，跳过
      }
    } catch {
      // 忽略错误，不覆盖现有房间观众
    }
  }

  async function loadRoomMessageHistory(roomId: string) {
    try {
      if (loadedRoomsHistory.has(String(roomId))) {
        return
      }
      const base = getApiBase()
      const url = new URL('/api/events', base)
      url.searchParams.set('room_id', String(roomId))
      url.searchParams.set('type', 'danmaku')
      url.searchParams.set('pageSize', '10')
      url.searchParams.set('page', '1')
      const roomStore = useRoomStore()
      const room = roomStore.getRoomById(String(roomId))
      const liveKey = String(room?.liveId || '')
      if (liveKey) {
        url.searchParams.set('live_id', liveKey)
      }
      const ts0 = firstEventTsByRoom[String(roomId)]
      if (Number.isFinite(ts0) && ts0 > 0) {
        url.searchParams.set('to_ts', String(ts0 - 1))
      }
      const r = await fetch(url.toString(), { method: 'GET' })
      const res = await r.json()
      const list = Array.isArray(res?.items) ? res.items : []
      const items: any[] = []
      for (const ev of list) {
        if (String(ev?.event_type || '') === 'danmaku') {
          const nickname = String(ev?.user_name || '')
          const avatarRaw = String((ev?.raw && (ev.raw.userInfo?.avatar || ev.raw.user?.avatar)) || '')
          const content = String(ev?.content || '')
          const time = Number(ev?.ts || Date.now())
          const userIdNum = Number(ev?.user_id || 0) || 0
          let medal = undefined
          const m0 = (ev?.raw && (ev.raw.userInfo?.medal || ev.raw.user?.medal)) || null
          if (m0 && (m0.clubName || m0.level != null)) {
            medal = { clubName: String(m0.clubName || ''), level: Number(m0.level || 0) }
          }
          items.push({
            id: makeMessageId(String(roomId), 'comment', ev, time),
            type: 'comment',
            nickname,
            avatar: normalizeAvatarUrl(avatarRaw),
            content,
            time,
            userId: userIdNum || undefined,
            userName: nickname || undefined,
            medal
          })
        }
      }
      items.sort((a, b) =>  a.time-b.time )
      const key = String(roomId)
      const arr = messagesByRoom[key] || []
      const set = messageIdsByRoom[key] || (messageIdsByRoom[key] = new Set<string>())
      for (const it of items) {
        if (!set.has(it.id)) {
          set.add(it.id)
          arr.push(it)
        }
      }
      arr.sort((a, b) => a.time-b.time)
      if (arr.length > 50) {
        arr.splice(0, arr.length - 50)
      }
      messagesByRoom[key] = arr
      loadedRoomsHistory.add(String(roomId))
    } catch {}
  }


  function getTs(msg: any): number {
    return Number((msg as any)?.ts ?? Date.now())
  }

  function extractUser(data: any): { nickname: string; avatar: string; userId?: number; userName?: string; medal?: { clubName: string; level: number } } {
    const nickname = String((data as any)?.username ?? (data as any)?.userInfo?.nickname ?? (data as any)?.danmuInfo?.userInfo?.nickname ?? '')
    const avatarRaw = String((data as any)?.danmuInfo?.userInfo?.avatar ?? (data as any)?.user?.avatar ?? (data as any)?.userInfo?.avatar ?? (data as any)?.avatar ?? '')
    const avatar = normalizeAvatarUrl(avatarRaw || `https://cdn.ui-avatars.com/api/?name=${encodeURIComponent(nickname || '用户')}`)
    const uid = Number((data as any)?.userId ?? (data as any)?.userInfo?.userID ?? (data as any)?.danmuInfo?.userInfo?.userID ?? 0) || undefined
    const userName = nickname || undefined
    const m0 = ((data as any)?.danmuInfo?.userInfo?.medal ?? (data as any)?.userInfo?.medal) || undefined
    const medal = m0 ? { clubName: String(m0.clubName || ''), level: Number(m0.level || 0) } : undefined
    return { nickname, avatar, userId: uid, userName, medal }
  }

  function buildItem(roomId: string, type: string, data: any, ts: number, content: string) {
    const u = extractUser(data)
    return { id: makeMessageId(roomId, type, data, ts), type, nickname: u.nickname, avatar: u.avatar, content, time: ts, userId: u.userId, userName: u.userName, medal: u.medal }
  }

  function attachDanmuStatsListener() {
    try {
      if (subscribed) return
      subscribed = true
      const handler = async (msg: any) => {
        try {
          const rid = String(msg?.room_id || '')
          const raw = (msg && msg.raw) || {}
          const data = (raw && (raw.data || raw)) || {}
          const typeNorm = String(msg?.event_type || '')
          const rawAction = String(((data as any)?.actionType) ?? ((raw as any)?.actionType) ?? ((raw as any)?.type) ?? '')
          const mapped = rawAction === 'enterRoom' ? 'enter' : (rawAction === 'followAuthor' ? 'follow' : (rawAction === 'richText' ? 'system' : rawAction))
          const type = mapped || typeNorm
          const isHistory = !!(msg?.isHistory || (msg as any)?.raw?.isHistory || (msg as any)?.raw?.raw?.isHistory)
          if (type === 'recentComment') { return }
          const roomStore = useRoomStore()
          const account = useAccountStore()
          const myUid = String(account?.userInfo?.userID || '')
          const room = roomStore.getRoomById(rid)
          const liverUid = String(room?.streamer?.userId || (room as any)?.liverUID || '')
          const keyId = rid
          if (!firstEventTsByRoom[keyId]) {
            const ts0 = Number((msg as any)?.ts ?? Date.now())
            firstEventTsByRoom[keyId] = ts0
            if (!loadedRoomsHistory.has(keyId)) {
              try {
                await loadRoomMessageHistory(keyId)
                loadedRoomsHistory.add(keyId)
              } catch {}
            }
          }
          if (type === 'displayInfo') {
            const oc = Number((data as any).watchingCount)
            const lc = Number((data as any).likeCount)
            const prev = statsByRoom[keyId] || { onlineCount: 0, likeCount: 0, giftCount: 0, bananaCount: 0 }
            if (Number.isFinite(oc)) prev.onlineCount = oc
            if (Number.isFinite(lc)) prev.likeCount = lc
            statsByRoom[keyId] = prev
          } else if (type === 'bananaCount') {
            const bc = Number((data as any)?.data ?? data)
            const prev = statsByRoom[keyId] || { onlineCount: 0, likeCount: 0, giftCount: 0, bananaCount: 0 }
            if (Number.isFinite(bc)) prev.bananaCount = bc
            statsByRoom[keyId] = prev
          } else if (type === 'danmaku' || type === 'comment') {
            if (isHistory) { return }
            const content = String((data as any)?.content ?? '')
            const ts = getTs(msg)
            const item = buildItem(keyId, 'comment', data, ts, content)
            appendRoomMessage(keyId, item)
          } else if (type === 'gift') {
            const uid = Number((data as any)?.userId ?? (data as any)?.userInfo?.userID ?? 0)
            const name = String((data as any)?.username ?? (data as any)?.userInfo?.nickname ?? (data as any)?.danmuInfo?.userInfo?.nickname ?? '')
            const avatar = normalizeAvatarUrl(String((data as any)?.danmuInfo?.userInfo?.avatar ?? (data as any)?.user?.avatar ?? (data as any)?.userInfo?.avatar ?? (data as any)?.avatar ?? '') || `https://cdn.ui-avatars.com/api/?name=${encodeURIComponent(name || '用户')}`)
            const value = Number((data as any)?.value || (data as any)?.price || 1)
            const key = String(uid || name || Math.random())
            const prevGift = giftMap[key]
            if (prevGift) {
              prevGift.value += value
              prevGift.count += 1
            } else {
              giftMap[key] = { userID: uid, nickname: name, avatar, value, count: 1 }
            }
            const roomMap = giftMapByRoom[keyId] || (giftMapByRoom[keyId] = {})
            const prevRoomGift = roomMap[key]
            if (prevRoomGift) {
              prevRoomGift.value += value
              prevRoomGift.count += 1
            } else {
              roomMap[key] = { userID: uid, nickname: name, avatar, value, count: 1 }
            }
          const prevStats = statsByRoom[keyId] || { onlineCount: 0, likeCount: 0, giftCount: 0, bananaCount: 0 }
          prevStats.giftCount += 1
          statsByRoom[keyId] = prevStats
          const giftName = String((data as any).giftDetail?.giftName)
          const giftCount = Number((data as any)?.count)
          console.log(data)
          const content = `送出了「${giftName}」x${Number.isFinite(giftCount) && giftCount > 0 ? giftCount : 1}`
          const ts = Number((msg as any)?.ts ?? Date.now())
          const item = {
            id: makeMessageId(keyId, 'gift', data, ts),
            type: 'gift',
            nickname: name,
            avatar,
            content,
            time: ts,
            userId: uid || undefined,
            userName: name || undefined,
            medal: ((data as any)?.danmuInfo?.userInfo?.medal ?? (data as any)?.userInfo?.medal) ? {
              clubName: String(((data as any)?.danmuInfo?.userInfo?.medal ?? (data as any)?.userInfo?.medal).clubName || ''),
              level: Number(((data as any)?.danmuInfo?.userInfo?.medal ?? (data as any)?.userInfo?.medal).level || 0)
            } : undefined
          }
          appendRoomMessage(keyId, item)
        } else if (type === 'like') {
          const delta = Number((data as any)?.likeDelta ?? (data as any)?.likeCount ?? NaN)
          const content = Number.isFinite(delta) ? `点赞了直播间 +${delta}` : '点赞了直播间'
          const ts = getTs(msg)
          const item = buildItem(keyId, 'like', data, ts, content)
          appendRoomMessage(keyId, item)
        } else if (type === 'enter') {
          const ts = getTs(msg)
          const item = buildItem(keyId, 'enter', data, ts, '进入了直播间')
          appendRoomMessage(keyId, item)
        } else if (type === 'follow') {
          const ts = getTs(msg)
          const item = buildItem(keyId, 'follow', data, ts, '关注了主播')
          appendRoomMessage(keyId, item)
        } else if (type === 'shareLive') {
          const ts = getTs(msg)
          const item = buildItem(keyId, 'shareLive', data, ts, '分享了直播间')
          appendRoomMessage(keyId, item)
        } else if (type === 'system') {
          const content = String((data as any)?.content ?? '')
          const ts = getTs(msg)
          const item = buildItem(keyId, 'system', data, ts, content)
          appendRoomMessage(keyId, item)
        }
        } catch {}
      }
      ;(window as any).electronApi?.on('room.event', handler)
      const statusHandler = async (payload: RoomStatusEventPayload) => {
        try {
          const rid = String(payload?.roomId || payload?.room_id || '')
          const status = String(payload?.status || '')
          const liveKey = String(payload?.liveId || '')
          const si = (payload as any)?.streamInfo || null
          if (rid && liveKey) {
            try { useRoomStore().updateRoomSettings(rid, { liveId: liveKey }) } catch {}
          }
          if (rid && si) {
            try { useRoomStore().updateRoomSettings(rid, { streamInfo: si }) } catch {}
          }
          if (rid && status === 'connected') {
            if (!liveKey) {
              try {
                const d = await (window as any).electronApi?.room?.details?.(rid)
                if (d && d.success && d.data && typeof d.data.liveId === 'string' && d.data.liveId) {
                  try { useRoomStore().updateRoomSettings(rid, { liveId: String(d.data.liveId) }) } catch {}
                }
              } catch {}
            }
          }
          if (rid && status === 'connected' && !loadedRoomsHistory.has(rid)) {
            loadRoomMessageHistory(rid).then(() => {
              loadedRoomsHistory.add(rid)
            }).catch(() => {})
          }
        } catch {}
      }
      ;(window as any).electronApi?.on('room.status', statusHandler)
    } catch {}
  }

  function startPolling() {
    try {
      if (refreshTimer.value) return
      const runOnce = async () => {
        if (isLive.value) {
          await loadAudience()
        } else {
          await ensureLiveId()
          if (isLive.value) {
            await loadAudience()
          } else {
          // 停止时不再重置根字段，按房间数据保持原状
          }
        }
      }
      // 先执行一次，随后进入轮询
      runOnce()
      refreshTimer.value = setInterval(runOnce, 10000)
    } catch {}
  }

  const giftLeaderboard = computed(() => {
    const arr = Object.values(giftMap)
    arr.sort((a, b) => b.value - a.value || b.count - a.count)
    return arr.slice(0, 10)
  })

  function getRoomGiftLeaderboard(roomId: string) {
    const roomMap = giftMapByRoom[String(roomId)] || {}
    const arr = Object.values(roomMap)
    arr.sort((a, b) => b.value - a.value || b.count - a.count)
    return arr
  }

  async function fetchWatchingListForRoom(roomId: string) {
    try {
      const roomStore = useRoomStore()
      const room = roomStore.getRoomById(String(roomId))
      const liveKey = String(room?.liveId || '')
      if (!liveKey) return
      const urlWatch = new URL('/api/acfun/live/watching-list', getApiBase())
      urlWatch.searchParams.set('liveId', liveKey)
      const res = await fetch(urlWatch.toString(), { method: 'GET' })
      const data = await res.json()
      if (data && data.success && Array.isArray(data.data)) {
        const mapped = data.data.map((w: any) => ({
          userID: Number(w.userInfo?.userID || 0),
          nickname: String(w.userInfo?.nickname || ''),
          avatar: normalizeAvatarUrl(String(w.userInfo?.avatar || '')),
          isManager: Number(w.userInfo?.managerType || 0) === 1,
          badge: w.userInfo?.medal ? { clubName: String(w.userInfo.medal.clubName || ''), level: Number(w.userInfo.medal.level || 0) } : undefined,
          giftCount: 0,
          likeCount: 0,
          bananaCount: 0
        }))
        audienceByRoom[String(roomId)] = mapped
        const roomMap = giftMapByRoom[String(roomId)] || (giftMapByRoom[String(roomId)] = {})
        for (const w of data.data) {
          const uid = Number(w?.userInfo?.userID || 0)
          const name = String(w?.userInfo?.nickname || '')
          const avatar = normalizeAvatarUrl(String(w?.userInfo?.avatar || ''))
          const raw = String(w?.displaySendAmount || '')
          const val = Number(raw.replace(/[^\d.]/g, '')) || 0
          const key = String(uid || name || Math.random())
          const prev = roomMap[key]
          if (prev) {
            prev.value = Math.max(prev.value, val)
          } else {
            roomMap[key] = { userID: uid, nickname: name, avatar, value: val, count: 0 }
          }
        }
      } else {
        audienceByRoom[String(roomId)] = []
      }
    } catch {}
  }

  function getCurrentManageRoomIdFromLocation(): string {
    try {
      const href = String(window.location.href || '')
      const hash = String(window.location.hash || '')
      const src = hash && hash.includes('/live/manage') ? hash : href
      if (!src.includes('/live/manage')) return ''
      const seg = src.split('/').filter(Boolean)
      const last = seg[seg.length - 1] || ''
      const cleaned = last.replace(/[#?].*$/, '')
      return cleaned
    } catch { return '' }
  }

  function isOnLiveManagePage(): boolean {
    try {
      const href = String(window.location.href || '')
      const hash = String(window.location.hash || '')
      return href.includes('/live/manage') || hash.includes('/live/manage')
    } catch { return false }
  }

  const watchlistGlobalIntervalMs = ref<number>(15000)
  let watchlistEventsBound = false

  async function runGlobalWatchlistTick() {
    try {
      if (!isOnLiveManagePage()) return
      const rid = getCurrentManageRoomIdFromLocation()
      if (!rid) return
      await fetchWatchingListForRoom(rid)
    } catch {}
  }

  function startGlobalWatchingListPolling(intervalMs = 15000) {
    watchlistGlobalIntervalMs.value = intervalMs
    if (watchlistGlobalTimer.value) {
      clearInterval(watchlistGlobalTimer.value)
      watchlistGlobalTimer.value = null
    }
    runGlobalWatchlistTick()
    watchlistGlobalTimer.value = setInterval(runGlobalWatchlistTick, watchlistGlobalIntervalMs.value) as unknown as number
    if (!watchlistEventsBound) {
      const handler = () => {
        try {
          runGlobalWatchlistTick()
          if (watchlistGlobalTimer.value) {
            clearInterval(watchlistGlobalTimer.value)
            watchlistGlobalTimer.value = null
          }
          watchlistGlobalTimer.value = setInterval(runGlobalWatchlistTick, watchlistGlobalIntervalMs.value) as unknown as number
        } catch {}
      }
      window.addEventListener('hashchange', handler)
      window.addEventListener('popstate', handler)
      watchlistEventsBound = true
    }
  }

  function stopGlobalWatchingListPolling() {
    const t = watchlistGlobalTimer.value
    if (t) {
      clearInterval(t)
      watchlistGlobalTimer.value = null
    }
    if (watchlistEventsBound) {
      try {
        // 由于无法获取先前的回调引用，这里通过重置定时器达到目的；事件监听保持幂等无需重复绑定
      } catch {}
      watchlistEventsBound = false
    }
  }

  function stopPolling() {
    if (refreshTimer.value) {
      clearInterval(refreshTimer.value)
      refreshTimer.value = null
    }
  }

  function handleLiveStop() {
    isLive.value = false
    stopPolling()
  }

  attachDanmuStatsListener()
  startPolling()
  startGlobalWatchingListPolling()

  function getRoomAudience(roomId: string): User[] {
    return audienceByRoom[String(roomId)] || []
  }
  function getRoomMessages(roomId: string): any[] {
    return messagesByRoom[String(roomId)] || []
  }
  function getRoomStats(roomId: string): LiveStats {
    return statsByRoom[String(roomId)] || { onlineCount: 0, likeCount: 0, giftCount: 0, bananaCount: 0 }
  }

  function appendRoomMessage(roomId: string, item: { id: string; type: string; nickname: string; avatar: string; content: string; time: number; userId?: number; userName?: string; medal?: { clubName: string; level: number } }) {
    const key = String(roomId)
    const arr = messagesByRoom[key] || []
    const set = messageIdsByRoom[key] || (messageIdsByRoom[key] = new Set<string>())
    if (set.has(item.id)) {
      messagesByRoom[key] = arr
      return
    }
    set.add(item.id)
    arr.push(item)
    if (arr.length > 50) {
      arr.splice(0, arr.length - 50)
    }
    messagesByRoom[key] = arr
  }

  return { liveId, isLive, liveInfo, stats, giftLeaderboard, setLiveStarted, ensureLiveId, loadAudience, startPolling, stopPolling, handleLiveStop, attachDanmuStatsListener, getRoomAudience, getRoomMessages, getRoomStats, appendRoomMessage, getRoomGiftLeaderboard, startGlobalWatchingListPolling, stopGlobalWatchingListPolling, loadRoomMessageHistory, fetchWatchingListForRoom }
})
