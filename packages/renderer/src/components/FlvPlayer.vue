<template>
  <div :id="localMountId" class="local-player-slot"></div>
  <t-dialog v-model:visible="enlarged" title="视频预览" width="720px" @close="onDialogClose">
    <div :id="dialogMountId" class="dialog-player-slot" style="width:100%;height:405px"></div>
  </t-dialog>
  <div ref="wrapperEl" class="player-wrapper">
    <video ref="videoEl" :poster="poster" :autoplay="autoplay" :muted="mutedState" :controls="false" playsinline></video>
    <div v-if="error" class="error-overlay">加载失败</div>
    <div class="controlbar">
      <div class="icon-btn" @click="togglePlay" :title="isPlaying ? '暂停' : '播放'">
        <template v-if="isPlaying"><PauseCircleIcon size="16" /></template>
        <template v-else><PlayCircleIcon size="16" /></template>
      </div>
      <div class="mute-wrap">
        <div class="icon-btn" @click="toggleMute" :title="mutedState ? '取消静音' : '静音'">
          <SoundMuteIcon v-if="mutedState" size="16" />
          <SoundIcon v-else size="16" />
        </div>
        <input class="volume-slider" type="range" min="0" max="1" step="0.01" v-model.number="volume" @input="applyVolume" />
      </div>
      <div class="icon-btn" @click="togglePiP" :title="pipActive ? '退出画中画' : '画中画'">
        <VideoIcon size="16" />
      </div>
      <div class="icon-btn" @click="openDialog" title="放大显示">
        <FullscreenIcon size="16" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, onBeforeUnmount, watch, computed, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { Dialog as TDialog } from 'tdesign-vue-next'
const tDialog = TDialog
import flvjs from 'flv.js'
import { PlayCircleIcon, PauseCircleIcon, SoundIcon, SoundMuteIcon, FullscreenIcon, VideoIcon } from 'tdesign-icons-vue-next'

const props = defineProps<{ src: string; autoplay?: boolean; muted?: boolean; poster?: string }>()
const videoEl = ref<HTMLVideoElement | null>(null)
const player = ref<flvjs.Player | null>(null)
const error = ref(false)
const emit = defineEmits<{ (e: 'error'): void }>()
const isPlaying = ref(false)
const mutedState = ref(!!props.muted)
const volume = ref(1)
const enlarged = ref(false)
const pipActive = ref(false)
const userPaused = ref(false)
const uid = Math.random().toString(36).slice(2)
const localMountId = `flv-local-${uid}`
const dialogMountId = `flv-dialog-${uid}`
const currentMountSelector = computed(() => `#${enlarged.value ? dialogMountId : localMountId}`)
const wrapperEl = ref<HTMLElement | null>(null)
const globalHostId = 'flv-pip-host'
const routeChanging = ref(false)
const route = useRoute()
let routeTimer: any = null

function destroy() {
  try { player.value?.destroy() } catch {}
  player.value = null
}

function setup() {
  error.value = false
  destroy()
  const url = String(props.src || '')
  if (!url) return
  if (!flvjs.isSupported()) { error.value = true; return }
  const p = flvjs.createPlayer({ type: 'flv', url })
  player.value = p
  const v = videoEl.value
  if (!v) return
  p.attachMediaElement(v)
  p.on(flvjs.Events.ERROR, () => { error.value = true; try { emit('error') } catch {} })
  p.load()
  if (props.autoplay !== false) { try { v.play() } catch {} }
  try {
    v.muted = mutedState.value
    v.volume = volume.value
  } catch {}
  bindVideoEvents()
}

onMounted(() => { setup() })
onBeforeUnmount(() => {
  if (pipActive.value) {
    placeInTarget(globalHostId)
  }
})
onUnmounted(() => { document.removeEventListener('visibilitychange', handleVisibility); if (!pipActive.value) { destroy() } })
watch(() => props.src, () => { setup() })

function placeInTarget(id: string) {
  try {
    let host = document.getElementById(id)
    if (!host && id === globalHostId) {
      host = document.createElement('div')
      host.id = globalHostId
      host.style.position = 'fixed'
      host.style.left = '-9999px'
      host.style.top = '-9999px'
      host.style.width = '1px'
      host.style.height = '1px'
      document.body.appendChild(host)
    }
    const node = wrapperEl.value
    if (host && node && host !== node.parentElement) {
      host.appendChild(node)
    }
  } catch {}
}

onMounted(() => {
  placeInTarget(localMountId)
  document.addEventListener('visibilitychange', handleVisibility)
  try {
    watch(() => route.fullPath, () => {
      routeChanging.value = true
      if (routeTimer) { clearTimeout(routeTimer); routeTimer = null }
      routeTimer = setTimeout(() => { routeChanging.value = false; routeTimer = null }, 2000)
    })
  } catch {}
})

function bindVideoEvents() {
  const v = videoEl.value
  if (!v) return
  v.addEventListener('play', () => { isPlaying.value = true })
  v.addEventListener('pause', () => { isPlaying.value = false })
  v.addEventListener('enterpictureinpicture', () => { pipActive.value = true })
  v.addEventListener('leavepictureinpicture', () => {
    pipActive.value = false
    if (routeChanging.value) { return }
    try { placeInTarget(enlarged.value ? dialogMountId : localMountId) } catch {}
  })
  v.addEventListener('pause', () => {
    if (pipActive.value && !userPaused.value) {
      try { v.play() } catch {}
    }
  })
}

function togglePlay() {
  const v = videoEl.value
  if (!v) return
  if (v.paused) { userPaused.value = false; v.play().catch(() => {}) } else { userPaused.value = true; v.pause() }
}

function toggleMute() {
  mutedState.value = !mutedState.value
  const v = videoEl.value
  if (v) v.muted = mutedState.value
}

function applyVolume() {
  const v = videoEl.value
  if (!v) return
  v.volume = Math.max(0, Math.min(1, volume.value || 0))
  if (v.volume > 0 && v.muted) { v.muted = false; mutedState.value = false }
}

async function togglePiP() {
  try {
    const v = videoEl.value
    const doc: any = document as any
    if (!v) return
    if (doc.pictureInPictureElement) {
      await doc.exitPictureInPicture?.()
      if (!routeChanging.value) { try { placeInTarget(enlarged.value ? dialogMountId : localMountId) } catch {} }
    } else {
      if (!doc.pictureInPictureEnabled) return
      await (v as any).requestPictureInPicture?.()
      placeInTarget(globalHostId)
    }
  } catch {}
}

function handleVisibility() {
  const v = videoEl.value
  if (!v) return
  if (document.hidden && pipActive.value && v.paused && !userPaused.value) {
    try { v.play() } catch {}
  }
}

function openDialog() {
  enlarged.value = true
  nextTick(() => { placeInTarget(dialogMountId) })
}
function onDialogClose() {
  enlarged.value = false
  nextTick(() => { placeInTarget(localMountId) })
}
</script>

<style scoped>
.player-wrapper { position: relative; width: 100%; height: 100% }
.error-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.4); color: #fff; font-size: 12px }
video { width: 100%; height: 100%; object-fit: cover }
.controlbar { position: absolute; left: 0; right: 0; bottom: 0; height: 24px; display: flex; align-items: center; gap: 6px; padding: 2px 6px; background: rgba(0,0,0,0.35); color: #fff }
.icon-btn { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; background: transparent; border-radius: 4px; color: #fff; cursor: pointer; opacity: 0.9 }
.icon-btn:hover { opacity: 1; background: rgba(255,255,255,0.12) }
.mute-wrap { display: flex; align-items: center; gap: 4px; position: relative }
.volume-slider { width: 0; opacity: 0; transition: width 0.2s ease, opacity 0.2s ease; }
.mute-wrap:hover .volume-slider { width: 72px; opacity: 1; }
.local-player-slot, .dialog-player-slot { position: relative }
</style>
