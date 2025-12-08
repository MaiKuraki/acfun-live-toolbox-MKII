<template>
  <div class="console-page">
    <div class="page-header">
      <h1 class="page-title">系统监控</h1>
    </div>

    <t-card class="logs-card" hover-shadow>
      <div class="log-header">
        <div class="log-title-section">
          <t-icon name="root-list" style="font-size: 16px;" />
          <span class="title">实时日志</span>
          <t-tag v-if="!autoScroll" theme="warning" size="small">已暂停</t-tag>
        </div>
        <div class="filters">
          <t-checkbox v-model="debugMode">Debug</t-checkbox>
          <t-select 
            v-model="levelFilter" 
            :options="levelOptions" 
            clearable 
            class="filter-item level-filter" 
            placeholder="筛选级别"
          />
          <t-input 
            v-model="textFilter" 
            class="filter-item search-input" 
            placeholder="搜索日志内容…" 
            clearable
          >
            <template #prefix-icon>
              <t-icon name="search" style="font-size: 14px;" />
            </template>
          </t-input>
          <t-button 
            theme="primary" 
            @click="exportLogs"
            class="export-btn"
          >
            <template #icon>
              <t-icon name="download" />
            </template>
            导出日志
          </t-button>
        </div>
      </div>
      <div ref="logListRef" class="log-container">
        <div class="log-list" @scroll="handleScroll">
          <div 
            v-for="(log, idx) in visibleLogs" 
            :key="`${log.timestamp}-${log.source}-${log.message?.substring(0, 50)}-${idx}`" 
            class="log-row" 
            :data-level="normalizeLogLevel(log.level)"
            :class="{ 'highlight': isLong(log) }"
          >
            <div class="log-time">
              <t-icon name="time" />
              <span class="ts">{{ formatTs(log.timestamp ?? log.ts) }}</span>
            </div>
            <div class="log-level">
              <t-tag 
                :theme="getLevelTheme(log.level)" 
                size="small"
                class="level-tag"
              >
                {{ normalizeLogLevel(log.level).toUpperCase() }}
              </t-tag>
            </div>
            <div class="log-source">
              <t-icon name="folder" />
              <span class="source">{{ log.source }}</span>
            </div>
            <div class="log-message">
              <span class="message-text">{{ isLong(log) ? truncateMessage(log.message) : log.message }}</span>
              <t-button 
                v-if="isLong(log)" 
                size="small" 
                variant="text" 
                @click="viewFull(log)"
                class="view-full-btn"
              >
                <t-icon name="browse" style="font-size: 12px;" />
                查看全文
              </t-button>
            </div>
          </div>
        </div>
        <div v-if="visibleLogs.length === 0 && filteredLogs.length === 0" class="empty-state">
          <t-icon name="file-search" size="large" />
          <p>暂无日志数据</p>
          <span class="empty-desc">日志将实时显示在这里</span>
        </div>
      </div>
    </t-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useConsoleStore } from '../stores/console'
import GlobalPopup from '../services/globalPopup'
import { useNetworkStore } from '../stores/network'
import { getApiBase } from '../utils/hosting'

type LogEntry = { timestamp?: string | number; level: 'info' | 'error' | 'warn' | 'debug'; source?: string; message?: string; correlationId?: string; ts?: number }

interface Command {
  name: string
  description: string
  category: string
  usage?: string
}

interface Session {
  id: string
  room?: string
  startTime: string
  lastActivity?: string
  status: string
  details?: string
}

const commands = ref<Command[]>([])
const logs = ref<LogEntry[]>([])
const debugMode = ref(false)
const levelFilter = ref<string>('')
const textFilter = ref('')
const autoScroll = ref(true)
const logListRef = ref<HTMLDivElement | null>(null)
let resumeTimer: number | null = null
const levelOptions = [
  { label: '全部', value: '' },
  { label: '错误', value: 'error' },
  { label: '警告', value: 'warn' },
  { label: '信息', value: 'info' },
  { label: '调试', value: 'debug' }
]

const filteredLogs = computed(() => {
  const filtered = logs.value.filter(l => {
    const hasMessage = String(l.message || '').trim().length > 0
    if (!hasMessage) return false
    if (!debugMode.value) {
      if (normalizeLogLevel(l.level) !== 'error') return false
    } else {
      if (levelFilter.value && normalizeLogLevel(l.level) !== levelFilter.value) return false
    }
    if (textFilter.value && !String(l.message || '').toLowerCase().includes(textFilter.value.toLowerCase())) return false
    return true
  })
  return filtered.reverse()
})

// Virtual scrolling state
const visibleLogs = ref<LogEntry[]>([])
const scrollTop = ref(0)
const containerHeight = ref(0)
const itemHeight = 44 // Approximate height of each log row
const bufferSize = 20 // Number of items to render outside visible area
let updateTimer: number | null = null

const updateVisibleLogs = () => {
  // Debounce updates to prevent excessive re-renders
  if (updateTimer) clearTimeout(updateTimer)
  updateTimer = window.setTimeout(() => {
    const totalLogs = filteredLogs.value
    const startIndex = Math.max(0, Math.floor(scrollTop.value / itemHeight) - bufferSize)
    const endIndex = Math.min(totalLogs.length, Math.ceil((scrollTop.value + containerHeight.value) / itemHeight) + bufferSize)
    
    visibleLogs.value = totalLogs.slice(startIndex, endIndex)
    
    // Update container padding to maintain scroll position
    const logListEl = document.querySelector('.log-list') as HTMLElement
    if (logListEl) {
      logListEl.style.paddingTop = `${startIndex * itemHeight}px`
      logListEl.style.paddingBottom = `${Math.max(0, (totalLogs.length - endIndex) * itemHeight)}px`
    }
  }, 16) // ~60fps update rate
}

const isLong = (l: LogEntry) => {
  try { return String(l.message || '').length > 160 } catch { return false }
}

// Memoized message truncation for performance
const truncateMessage = (message: string | undefined, maxLength: number = 160) => {
  try {
    const msg = String(message || '')
    return msg.length > maxLength ? msg.substring(0, maxLength) + '...' : msg
  } catch {
    return String(message || '')
  }
}

const viewFull = (l: LogEntry) => {
  try {
    const title = `[${String(l.level).toUpperCase()}] ${String(l.source || '')} @ ${formatTs(l.timestamp)}`
    GlobalPopup.alert(title, String(l.message || ''))
  } catch {}
}

const normalizeLogLevel = (level: any): 'error' | 'warn' | 'info' | 'debug' => {
  if (typeof level === 'string') {
    const l = level.trim().toLowerCase();
    if (l === 'error' || l === 'err' || l === 'e') return 'error';
    if (l === 'warn' || l === 'warning' || l === 'w') return 'warn';
    if (l === 'info' || l === 'log' || l === 'i') return 'info';
    if (l === 'debug' || l === 'trace' || l === 'd') return 'debug';
    return 'info';
  }
  if (typeof level === 'number') {
    // Common numeric mapping: 40+=error, 30+=warn, 20+=info, else debug
    if (level >= 40) return 'error';
    if (level >= 30) return 'warn';
    if (level >= 20) return 'info';
    return 'debug';
  }
  return 'info';
}

const getLevelTheme = (level: string) => {
  const normalizedLevel = normalizeLogLevel(level)
  const themeMap: Record<string, string> = {
    'error': 'danger',
    'warn': 'warning',
    'info': 'primary',
    'debug': 'default'
  }
  return themeMap[normalizedLevel] || 'default'
}

const getCategoryClass = (category: string) => {
  const categoryMap: Record<string, string> = {
    'system': 'category-system',
    'room': 'category-room',
    'event': 'category-event',
    'debug': 'category-debug',
    'plugin': 'category-plugin'
  }
  return categoryMap[category.toLowerCase()] || 'category-default'
}

const formatTs = (ts: string | number | undefined) => {
  try {
    if (ts === undefined || ts === null) return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    
    // Handle different timestamp formats
    let date: Date
    
    // If it's already a valid ISO string or timestamp
    if (typeof ts === 'string' && ts.includes('T')) {
      date = new Date(ts)
    } else if (typeof ts === 'number' || !isNaN(Number(ts))) {
      // Handle Unix timestamps
      date = new Date(Number(ts))
    } else {
      // Try to parse as date string
      date = new Date(ts)
    }
    
    if (isNaN(date.getTime())) {
      // If parsing fails, try to extract time from log message
      const timeMatch = typeof ts === 'string' ? ts.match(/(\d{1,2}):(\d{2}):(\d{2})/) : null
      if (timeMatch) {
        return timeMatch[0]
      }
      return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }
    
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch {
    return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }
}

const scrollToBottom = async () => {
  if (!autoScroll.value) return
  await nextTick()
  const el = logListRef.value
  if (el) {
    el.scrollTop = el.scrollHeight
    // Update visible logs after scroll
    scrollTop.value = el.scrollTop
    containerHeight.value = el.clientHeight
    updateVisibleLogs()
  }
}

const handleScroll = () => {
  const el = logListRef.value
  if (el) {
    scrollTop.value = el.scrollTop
    containerHeight.value = el.clientHeight
    updateVisibleLogs()
  }
  
  // Pause auto-scroll when user scrolls
  autoScroll.value = false
  if (resumeTimer) clearTimeout(resumeTimer)
  resumeTimer = window.setTimeout(() => { 
    autoScroll.value = true
    scrollToBottom() 
  }, 10000)
}



const exportLogs = async () => {
  try {
    const data = filteredLogs.value
    const suggested = `logs-${Date.now()}.json`
    const save = await window.electronApi.dialog.showSaveDialog({ title: '保存日志', defaultPath: suggested })
    const filePath = (save as any)?.filePath || (save as any)?.path
    if (!filePath) return
    await window.electronApi.fs.writeFile(String(filePath), JSON.stringify(data, null, 2))
  } catch {}
}

//

onMounted(async () => {
  try {
    const cs = useConsoleStore()
    await cs.createSession()
    const cmds = await cs.loadAvailableCommands()
    commands.value = cmds || []
  } catch {}

  // Initialize virtual scrolling
  nextTick(() => {
    const el = logListRef.value
    if (el) {
      containerHeight.value = el.clientHeight
      updateVisibleLogs()
    }
  })

  // Handle window resize
  const handleResize = () => {
    const el = logListRef.value
    if (el) {
      containerHeight.value = el.clientHeight
      updateVisibleLogs()
    }
  }
  window.addEventListener('resize', handleResize)
  ;(window as any)._consoleResizeHandler = handleResize

  try {
    const base = getApiBase()
    const es = new EventSource(new URL('/sse/system/logs', base).toString())
    es.addEventListener('init', (e: any) => {
      try {
        const arr = JSON.parse(e.data || '[]')
        logs.value = Array.isArray(arr) ? arr.slice(-1000) : []
        scrollToBottom()
      } catch {}
    })
    
    // Batch log updates for better performance
    let logBatch: LogEntry[] = []
    let batchTimer: number | null = null
    
    const processLogBatch = () => {
      if (logBatch.length > 0) {
        logs.value.push(...logBatch)
        // Keep only last 1000 logs to prevent memory issues
        if (logs.value.length > 1000) {
          logs.value = logs.value.slice(-1000)
        }
        logBatch = []
        scrollToBottom()
      }
      batchTimer = null
    }
    
    es.addEventListener('log', (e: any) => {
      try {
        const entry = JSON.parse(e.data || '{}') as LogEntry
        logBatch.push(entry)
        
        // Process batch immediately if it's getting large, or schedule processing
        if (logBatch.length >= 10) {
          if (batchTimer) clearTimeout(batchTimer)
          processLogBatch()
        } else if (!batchTimer) {
          batchTimer = window.setTimeout(processLogBatch, 100) // Process within 100ms
        }
      } catch {}
    })
    ;(window as any)._consoleLogES = es
  } catch {}

})

try {
  const ns = useNetworkStore()
  watch(() => ns.apiPort, () => {
    try {
      const prev: EventSource | undefined = (window as any)._consoleLogES
      if (prev) { try { prev.close() } catch {} }
      const base = getApiBase()
      const es = new EventSource(new URL('/sse/system/logs', base).toString())
      ;(window as any)._consoleLogES = es
    } catch {}
  })
} catch {}

// Watch for changes in filtered logs and update visible logs
watch(filteredLogs, () => {
  updateVisibleLogs()
}, { flush: 'post' })

onUnmounted(() => {
  try { const es: EventSource = (window as any)._consoleLogES; es && es.close && es.close() } catch {}
  try { const handler: () => void = (window as any)._consoleResizeHandler; if (handler) window.removeEventListener('resize', handler) } catch {}
  if (updateTimer) clearTimeout(updateTimer)
  if (resumeTimer) clearTimeout(resumeTimer)
})
</script>

<style scoped>
/* Modern Console Page Layout */
.console-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 16px;
  background: var(--td-bg-color-page);
  box-sizing: border-box;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--td-text-color-primary);
  line-height: 1.3;
}


.logs-card :deep(.t-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
  min-height: 0;
}


/* Enhanced Logs Card */
.logs-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  max-height: 100%;
  border-radius: 8px;
  background: var(--td-bg-color-container);
  border: 1px solid var(--td-border-level-1-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--td-border-level-1-color);
  background: var(--td-bg-color-container);
  border-radius: 8px 8px 0 0;
  gap: 16px;
}

.log-title-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.log-title-section .title {
  font-size: 16px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.filters {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: flex-end;
  flex: 1;
}

.filter-item {
  min-width: 140px;
}

.level-filter {
  width: 120px;
}

.search-input {
  width: 200px;
}

.search-input :deep(.t-input__prefix) {
  display: flex;
  align-items: center;
}

.export-btn {
  padding: 6px 12px;
  height: 32px;
}

.export-btn :deep(.t-button__icon) {
  font-size: 14px;
  line-height: 1;
  margin-right: 4px;
  vertical-align: middle;
}

.export-btn :deep(.t-button__content) {
  display: flex;
  align-items: center;
  line-height: 1;
}

/* Log Container */
.log-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.log-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 8px 8px 8px; /* Keep consistent padding */
  min-height: 0;
  position: relative; /* For virtual scrolling positioning */
}

.log-row {
  display: grid;
  grid-template-columns: 160px 80px 140px 1fr;
  gap: 12px;
  padding: 8px 12px;
  margin-bottom: 2px;
  border-radius: 4px;
  background: var(--td-bg-color-container);
  border: 1px solid transparent;
  transition: all 0.2s ease;
  align-items: flex-start;
  min-width: 0;
  word-break: break-word;
  contain: layout style paint; /* Performance optimization */
  will-change: transform; /* Smooth animations */
}

.log-row:hover {
  background: var(--td-bg-color-container-hover);
  border-color: var(--td-border-level-1-color);
  transform: translateX(2px);
}

.log-row.highlight {
  border-left: 3px solid var(--td-brand-color-6);
}

.log-row[data-level="error"] {
  background: linear-gradient(90deg, rgba(227, 77, 89, 0.15) 0%, transparent 100%);
  border-left: 3px solid rgba(227, 77, 89, 0.8);
}

.log-row[data-level="warn"] {
  background: linear-gradient(90deg, rgba(255, 165, 0, 0.15) 0%, transparent 100%);
  border-left: 3px solid rgba(255, 165, 0, 0.8);
}

.log-row[data-level="info"] {
  background: transparent;
  border-left: 3px solid rgba(0, 168, 255, 0.6);
}

.log-row[data-level="debug"] {
  background: linear-gradient(90deg, rgba(144, 147, 153, 0.1) 0%, transparent 100%);
  border-left: 3px solid rgba(144, 147, 153, 0.4);
}

/* Log Row Components */
.log-time {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--td-text-color-secondary);
}

.log-level {
  display: flex;
  align-items: center;
}

.level-tag {
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  min-width: 45px;
  text-align: center;
}

/* Enhanced level tag colors for better visibility */
.level-tag.t-tag--danger {
  background-color: rgba(227, 77, 89, 0.15) !important;
  color: #d32f2f !important;
  border-color: rgba(227, 77, 89, 0.3) !important;
}

.level-tag.t-tag--warning {
  background-color: rgba(255, 165, 0, 0.15) !important;
  color: #f57c00 !important;
  border-color: rgba(255, 165, 0, 0.3) !important;
}

.level-tag.t-tag--primary {
  background-color: rgba(0, 168, 255, 0.15) !important;
  color: #1976d2 !important;
  border-color: rgba(0, 168, 255, 0.3) !important;
}

.level-tag.t-tag--default {
  background-color: rgba(144, 147, 153, 0.15) !important;
  color: #606266 !important;
  border-color: rgba(144, 147, 153, 0.3) !important;
}

.log-source {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--td-text-color-secondary);
}

.log-message {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
  overflow: hidden;
}

.message-text {
  font-size: 13px;
  color: var(--td-text-color-primary);
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-word;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  flex: 1;
  contain: layout style paint; /* Performance optimization */
}

.view-full-btn {
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.log-row:hover .view-full-btn {
  opacity: 1;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--td-text-color-placeholder);
}

.empty-state p {
  margin: 16px 0 8px;
  font-size: 16px;
  font-weight: 500;
}

.empty-desc {
  font-size: 14px;
  color: var(--td-text-color-secondary);
}

/* Responsive Design */
@media (max-width: 1024px) {
  
  .log-row {
    grid-template-columns: 140px 70px 120px 1fr;
    gap: 8px;
  }
  
  .filters {
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
  .console-page {
    padding: 12px;
    gap: 8px;
  }
  
  .log-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .filters {
    justify-content: stretch;
  }
  
  .log-row {
    grid-template-columns: 1fr;
    gap: 6px;
  }
  
  .log-time,
  .log-source {
    font-size: 11px;
  }
  
  .message-text {
    font-size: 12px;
  }
}

/* Custom Scrollbar */
.log-list::-webkit-scrollbar {
  width: 6px;
}

.log-list::-webkit-scrollbar-track {
  background: var(--td-bg-color-secondarycontainer);
  border-radius: 3px;
}

.log-list::-webkit-scrollbar-thumb {
  background: var(--td-border-level-1-color);
  border-radius: 3px;
}

.log-list::-webkit-scrollbar-thumb:hover {
  background: var(--td-text-color-placeholder);
}
</style>
