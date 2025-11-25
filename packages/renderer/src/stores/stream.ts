import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAccountStore } from './account'
import { reportReadonlyUpdate, reportReadonlyInit } from '../utils/readonlyReporter'

function splitRtmp(input: string): { server?: string; key?: string } {
  if (!input || typeof input !== 'string') return {}
  const idx = input.indexOf('?')
  if (idx > 0) {
    return { server: input.slice(0, idx), key: input.slice(idx + 1) }
  }
  const parts = input.split('/')
  if (parts.length >= 4) {
    return { server: parts.slice(0, 3).join('/'), key: parts.slice(3).join('/') }
  }
  return { server: input }
}

export const useStreamStore = defineStore('stream', () => {
  const rtmpUrl = ref<string>('')
  const streamKey = ref<string>('')
  const expiresAt = ref<number | null>(null)
  const lastFetched = ref<number | null>(null)

  const isExpired = computed(() => !!expiresAt.value && Date.now() >= Number(expiresAt.value))
  const hasValid = computed(() => !!rtmpUrl.value && !!streamKey.value && !isExpired.value)

  async function setStreamInfo(info: { rtmpUrl?: string; streamKey?: string; expiresAt?: number }) {
    if (typeof info.rtmpUrl === 'string') rtmpUrl.value = info.rtmpUrl
    if (typeof info.streamKey === 'string') streamKey.value = info.streamKey
    if (typeof info.expiresAt === 'number') {
      expiresAt.value = info.expiresAt
    } else {
      expiresAt.value = Date.now() + 60 * 60 * 1000
    }
    lastFetched.value = Date.now()
  }

  async function refresh(force?: boolean) {
    if (!force && hasValid.value) return
    let r = ''
    let k = ''
    try {
      const settingsResult = await (window as any).electronApi.http.get('/api/acfun/live/stream-settings')
      if (settingsResult?.success && settingsResult.data) {
        const pushList = settingsResult.data.streamPushAddress || []
        const firstPush = Array.isArray(pushList) && pushList.length > 0 ? pushList[0] : ''
        const split = splitRtmp(firstPush)
        r = split.server || r
        k = split.key || settingsResult.data.streamName || k
      }
      const accountStore = useAccountStore()
      const userId = accountStore?.userInfo?.userID
      if (userId) {
        const info = await (window as any).electronApi.http.get('/api/acfun/live/user-info', { userID: userId })
        if (info?.success && info.data?.liveID) {
          const urlRes = await (window as any).electronApi.http.get('/api/acfun/live/stream-url', { liveId: info.data.liveID })
          if (urlRes?.success && urlRes.data?.rtmpUrl) {
            const split2 = splitRtmp(urlRes.data.rtmpUrl)
            r = split2.server || r
            k = split2.key || k
          }
        }
      }
    } catch {}
    if (!r) r = 'rtmp://live.acfun.cn/live'
    await setStreamInfo({ rtmpUrl: r, streamKey: k || '', expiresAt: Date.now() + 60 * 60 * 1000 })
    try {
      reportReadonlyInit({
        stream: {
          rtmpUrl: rtmpUrl.value,
          streamKey: streamKey.value,
          expiresAt: expiresAt.value
        }
      })
    } catch {}
    await syncReadonlyStore()
  }

  async function syncReadonlyStore() {
    reportReadonlyUpdate({
      stream: {
        rtmpUrl: rtmpUrl.value,
        streamKey: streamKey.value,
        expiresAt: expiresAt.value
      }
    })
  }

  return { rtmpUrl, streamKey, expiresAt, lastFetched, isExpired, hasValid, setStreamInfo, refresh, syncReadonlyStore }
})