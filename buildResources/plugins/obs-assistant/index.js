const { spawn, exec } = require('child_process')
const path = require('path')
let OBSWebSocket = null
try {
  const lib = require('./obs-websocket-js.js')
  OBSWebSocket = (lib && lib.OBSWebSocket) ? lib.OBSWebSocket : (lib || globalThis.OBSWebSocket || global.OBSWebSocket || null)
} catch {}

let state = {
  config: { obsPath: '', autoStartObs: true, syncStreaming: true, wsPort: 4455, wsPassword: '' },
  obs: null,
  connected: false,
  connecting: false
}

async function isObsRunning() {
  return await new Promise((resolve) => {
    try {
      exec('tasklist /FI "IMAGENAME eq obs64.exe"', (err, stdout) => {
        if (err) return resolve(false)
        const hasObs64 = typeof stdout === 'string' && stdout.toLowerCase().includes('obs64.exe')
        if (hasObs64) return resolve(true)
        exec('tasklist /FI "IMAGENAME eq obs.exe"', (e2, out2) => {
          if (e2) return resolve(false)
          const hasObs = typeof out2 === 'string' && out2.toLowerCase().includes('obs.exe')
          resolve(!!hasObs)
        })
      })
    } catch { resolve(false) }
  })
}

async function ensureObsRunning() {
  const running = await isObsRunning()
  if (running) return { ok: true, running: true }
  const p = String(state.config.obsPath || '').trim()
  if (!p) return { ok: false, error: 'OBS_PATH_NOT_CONFIGURED' }
  try {
    const child = spawn(p, [], { detached: true, stdio: 'ignore' })
    try { child.unref() } catch {}
    return { ok: true, launched: true }
  } catch (e) {
    return { ok: false, error: e && e.message ? e.message : String(e) }
  }
}

async function connectObs() {
  if (state.connected) return { ok: true }
  if (state.connecting) return { ok: false, error: 'CONNECT_IN_PROGRESS' }
  if (!OBSWebSocket) return { ok: false, error: 'OBS_WEBSOCKET_LIB_NOT_AVAILABLE' }
  const port = Number(state.config.wsPort || 4455)
  const password = String(state.config.wsPassword || '')
  const host = `ws://127.0.0.1:${port}`
  try {
    state.connecting = true
    const obs = new OBSWebSocket()
    await obs.connect(host, password ? { password } : undefined)
    state.obs = obs
    state.connected = true
    state.connecting = false
    return { ok: true }
  } catch (e) {
    state.connecting = false
    state.connected = false
    state.obs = null
    return { ok: false, error: e && e.message ? e.message : String(e) }
  }
}

function parseResolution(res) {
  try {
    const s = String(res || '')
    const m = s.match(/(\d+)x(\d+)/i)
    if (m) return { w: parseInt(m[1], 10), h: parseInt(m[2], 10) }
  } catch {}
  return null
}

async function applyObsSettings(stream, transcodes) {
  const server = String(stream && stream.rtmpUrl || '').trim()
  const key = String(stream && stream.streamKey || '').trim()
  if (!server || !key) return { ok: false, error: 'MISSING_STREAM_INFO' }
  const runRes = await ensureObsRunning()
  if (!runRes.ok) return runRes
  const conn = await connectObs()
  if (!conn.ok) return conn
  try {
    if (state.obs && typeof state.obs.call === 'function') {
      await state.obs.call('SetStreamServiceSettings', { streamServiceType: 'rtmp_custom', streamServiceSettings: { server, key } })
      const tc = Array.isArray(transcodes) && transcodes.length ? transcodes[0] : null
      if (tc && tc.resolution) {
        const r = parseResolution(tc.resolution)
        if (r) {
          try { await state.obs.call('SetVideoSettings', { baseWidth: r.w, baseHeight: r.h, outputWidth: r.w, outputHeight: r.h }) } catch {}
        }
      }
      return { ok: true, configured: true }
    }
    return { ok: false, error: 'OBS_INSTANCE_INVALID' }
  } catch (e) {
    return { ok: false, error: e && e.message ? e.message : String(e) }
  }
}

async function init() {
  try {
    if (state.config.autoStartObs) { await ensureObsRunning() }
    return { ok: true }
  } catch (e) { return { ok: false, error: e && e.message ? e.message : String(e) } }
}

async function onConfigUpdated(merged) {
  try {
    const next = Object.assign({}, state.config, merged || {})
    state.config = next
    if (next.autoStartObs) { await ensureObsRunning() }
    return { ok: true }
  } catch (e) { return { ok: false, error: e && e.message ? e.message : String(e) } }
}

async function cleanup() {
  try { if (state.obs && typeof state.obs.disconnect === 'function') { try { await state.obs.disconnect() } catch {} } } catch {}
  state.obs = null
  state.connected = false
  state.connecting = false
  return { ok: true }
}

module.exports = { init, onConfigUpdated, ensureObsRunning, applyObsSettings, cleanup }