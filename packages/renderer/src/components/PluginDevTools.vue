<template>
  <div class="plugin-dev-tools">
    <div class="dev-tools-content">
      <!-- 外部项目配置 -->
      <div class="config-section">
        <h4>外部项目配置</h4>
        
        <!-- 1. 插件配置文件 (Moved to top) -->
        <div class="form-group">
          <label>插件配置文件(manifest)：</label>
          <div class="path-input-group">
            <t-input
              v-model="config.manifestPath"
              placeholder="C:\path\to\your\plugin\manifest.json"
              readonly
            />
            <t-button
              variant="outline"
              @click="selectManifestPath"
            >
              选择文件
            </t-button>
          </div>
          <div class="help-text">
            选择插件的 manifest.json 文件
          </div>
        </div>

        <!-- 2. 开发服务器地址 (Renamed, Conditional) -->
        <div 
          v-if="showDevServer"
          class="form-group"
        >
          <label>开发服务器地址：</label>
          <t-input
            v-model="config.projectUrl"
            placeholder="http://localhost:3000"
            @blur="validateUrl"
          />
          <div
            v-if="urlError"
            class="error-message"
          >
            {{ urlError }}
          </div>
          <div class="help-text">
            输入您的Vue/React开发服务器地址
          </div>
        </div>

        <!-- 2.1 Overlay地址 (Derived) -->
        <div 
          v-if="showDevServer && manifestContent?.overlay"
          class="form-group"
        >
          <label>对应的Overlay地址：</label>
          <t-input
            :value="overlayUrl"
            readonly
            placeholder="等待配置开发服务器地址..."
          />
        </div>

        <!-- 2.2 UI地址 (Derived) -->
        <div 
          v-if="showDevServer && manifestContent?.ui"
          class="form-group"
        >
          <label>对应的UI地址：</label>
          <t-input
            :value="uiUrl"
            readonly
            placeholder="等待配置开发服务器地址..."
          />
        </div>

        <!-- 2.3 Window地址 (Derived) -->
        <div 
          v-if="showDevServer && manifestContent?.window"
          class="form-group"
        >
          <label>对应的Window地址：</label>
          <t-input
            :value="windowUrl"
            readonly
            disabled
            placeholder="等待配置开发服务器地址..."
          />
        </div>

        <!-- 3. index.js代码路径 (Renamed, Conditional, File selection) -->
        <div 
          v-if="showNodePath"
          class="form-group"
        >
          <label>index.js代码路径：</label>
          <div class="path-input-group">
            <t-input
              v-model="config.nodePath"
              placeholder="C:\path\to\your\plugin\index.js"
              readonly
            />
            <t-button
              variant="outline"
              @click="selectNodePath"
            >
              选择文件
            </t-button>
          </div>
          <div class="help-text">
            选择插件的 index.js 入口文件
          </div>
        </div>
        
      </div>

      <!-- 调试选项 -->
      <div class="config-section">
        <h4>调试选项</h4>
        
        <div class="checkbox-group">
          <t-checkbox v-model="config.hotReload">
            启用热重载
          </t-checkbox>
          <div class="help-text">
            文件变化时自动重新加载插件
          </div>
        </div>
      </div>

      <!-- 状态显示 -->
      <div class="status-section">
        <h4>连接状态</h4>
        
        <div 
          v-if="showDevServer"
          class="status-item"
        >
          <span class="status-label">前端项目：</span>
          <t-tag :theme="frontendStatus.connected ? 'success' : 'default'">
            {{ frontendStatus.connected ? '已连接' : '未连接' }}
          </t-tag>
          <span
            v-if="frontendStatus.url"
            class="status-url"
          >{{ frontendStatus.url }}</span>
        </div>

        <div 
          v-if="showNodePath"
          class="status-item"
        >
          <span class="status-label">后端代码：</span>
          <t-tag :theme="backendStatus.loaded ? 'success' : 'default'">
            {{ backendStatus.loaded ? '已加载' : '未加载' }}
          </t-tag>
          <span
            v-if="backendStatus.path"
            class="status-path"
          >{{ backendStatus.path }}</span>
        </div>
      </div>

      <!-- 操作按钮移除，统一由父对话框页脚控制 -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
const props = defineProps<{ pluginId?: string }>();

interface DevConfig {
  projectUrl: string;
  nodePath: string;
  manifestPath: string;
  hotReload: boolean;
}

interface ConnectionStatus {
  connected: boolean;
  url?: string;
}

interface BackendStatus {
  loaded: boolean;
  path?: string;
}

interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: number;
}

interface ManifestContent {
  main?: string;
  ui?: any;
  overlay?: any;
  window?: any;
  [key: string]: any;
}

const config = ref<DevConfig>({
  projectUrl: 'http://localhost:3000',
  nodePath: '',
  manifestPath: '',
  hotReload: true
});
const derivedPluginId = ref('');
const manifestContent = ref<ManifestContent | null>(null);

const frontendStatus = ref<ConnectionStatus>({ connected: false });
const backendStatus = ref<BackendStatus>({ loaded: false });
const debugLogs = ref<LogEntry[]>([]);

const urlError = ref('');
const testing = ref(false);
const testPassed = ref(false);

// Computed properties for visibility
const showDevServer = computed(() => {
  // If manifest is not loaded yet, show by default (or user preference? assuming show all as fallback)
  if (!manifestContent.value) return true;
  // Show if any UI related field exists
  return !!(manifestContent.value.ui || manifestContent.value.overlay || manifestContent.value.window);
});

const showNodePath = computed(() => {
  // If manifest is not loaded yet, show by default
  if (!manifestContent.value) return true;
  // Show if main field exists
  return !!manifestContent.value.main;
});

const canTest = computed(() => {
  const devServerReady = !showDevServer.value || (config.value.projectUrl && !urlError.value);
  const nodePathReady = !showNodePath.value || config.value.nodePath;
  const manifestReady = !!config.value.manifestPath;
  
  return devServerReady && nodePathReady && manifestReady;
});

// Derived URLs
function joinUrl(base: string, path: string): string {
  if (!base) return '';
  if (!path) return base;
  const baseUrl = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${baseUrl}${cleanPath}`;
}

const overlayUrl = computed(() => {
  if (!config.value.projectUrl || !manifestContent.value?.overlay) return '';
  // Handle various manifest formats: object with html/path or direct string (though schema usually implies object)
  const entry = manifestContent.value.overlay;
  const path = typeof entry === 'string' ? entry : (entry.html || entry.route || '');
  return joinUrl(config.value.projectUrl, path);
});

const uiUrl = computed(() => {
  if (!config.value.projectUrl || !manifestContent.value?.ui) return '';
  const entry = manifestContent.value.ui;
  const path = typeof entry === 'string' ? entry : (entry.html || entry.route || '');
  return joinUrl(config.value.projectUrl, path);
});

const windowUrl = computed(() => {
  if (!config.value.projectUrl || !manifestContent.value?.window) return '';
  const entry = manifestContent.value.window;
  const path = typeof entry === 'string' ? entry : (entry.html || entry.route || '');
  return joinUrl(config.value.projectUrl, path);
});

function validateUrl() {
  if (!showDevServer.value) {
    urlError.value = '';
    return;
  }
  urlError.value = '';
  if (config.value.projectUrl) {
    try {
      new URL(config.value.projectUrl);
    } catch {
      urlError.value = '请输入有效的URL地址';
    }
  }
}

async function selectNodePath() {
  try {
    const result = await window.electronApi?.dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'JavaScript', extensions: ['js'] }],
      title: '选择插件入口文件(index.js)'
    });
    
    if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
      config.value.nodePath = result.filePaths[0];
    }
  } catch (error) {
    addLog('error', `选择文件失败: ${error}`);
  }
}

async function selectManifestPath() {
  try {
    const result = await window.electronApi?.dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'JSON', extensions: ['json'] }],
      title: '选择manifest.json文件'
    });
    if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
      config.value.manifestPath = result.filePaths[0];
      await loadManifestContent();
    }
  } catch (error) {
    addLog('error', `选择文件失败: ${error}`);
  }
}

async function loadManifestContent() {
  if (!config.value.manifestPath) {
    manifestContent.value = null;
    return;
  }
  try {
    const text = await window.electronApi?.fs.readFile(config.value.manifestPath);
    manifestContent.value = JSON.parse(String(text || '{}'));
    
    // Auto-update derivedPluginId if possible
    const pid = String(manifestContent.value?.id || '').trim();
    if (pid) derivedPluginId.value = pid;
    
  } catch (error) {
    // console.error('Failed to load manifest:', error);
    addLog('warn', `无法读取或解析manifest: ${error}`);
    manifestContent.value = null;
  }
}

async function testLoad() {
  testing.value = true;
  testPassed.value = false;
  let lastError = '';
  let passed = false;
  try {
    const payload = {
      projectUrl: config.value.projectUrl,
      nodePath: config.value.nodePath,
      manifestPath: config.value.manifestPath
    };
    const res = await window.electronApi?.plugin.testConnection(payload);
    const inner = (res && (res as any).data) || {};
    const ok = !!inner.success;
    
    if (showDevServer.value) {
      frontendStatus.value = ok && (inner.projectUrl || payload.projectUrl) ? { connected: true, url: payload.projectUrl } : { connected: false };
    } else {
      frontendStatus.value = { connected: false };
    }
    
    if (showNodePath.value) {
      backendStatus.value = ok && (inner.nodePath || payload.nodePath) ? { loaded: true, path: payload.nodePath } : { loaded: false };
    } else {
      backendStatus.value = { loaded: false };
    }

    // Try to update ID if not already set (though loadManifestContent should have done it)
    if (ok && config.value.manifestPath && !manifestContent.value) {
      await loadManifestContent();
    }
    
    testPassed.value = !!ok;
    passed = !!ok;
    lastError = ok ? '' : String(inner?.error || '测试加载失败');
    addLog(ok ? 'info' : 'error', ok ? '测试加载通过' : lastError);
  } catch (error) {
    frontendStatus.value = { connected: false };
    backendStatus.value = { loaded: false };
    lastError = String((error as any)?.message || error);
    addLog('error', `测试加载失败: ${lastError}`);
    return { pass: false, error: lastError };
  } finally {
    testing.value = false;
  }
  return { pass: passed, error: passed ? '' : lastError } as any;
}

async function saveConfig() {
  try {
    // Only include DevConfig properties to avoid non-serializable data
    const payload = {
      projectUrl: config.value.projectUrl,
      ...(showNodePath.value && { nodePath: config.value.nodePath }),
      manifestPath: config.value.manifestPath,
      hotReload: config.value.hotReload,
      pluginId: derivedPluginId.value
    };
    await window.electronApi?.plugin.saveDevConfig(payload);
    addLog('info', '配置已保存');
  } catch (error) {
    addLog('error', `保存配置失败: ${error}`);
  }
}

async function loadConfig() {
  try {
    if (props.pluginId) {
      const res = await window.electronApi?.plugin.loadDevConfig(props.pluginId);
      if (res && (res as any).success) {
        const saved = (res as any).data || {};
        config.value = { ...config.value, ...saved };
        derivedPluginId.value = props.pluginId || '';
      } else if (res && (res as any).error) {
        addLog('error', `加载配置失败: ${(res as any).error}`);
      }
    } else {
      const result = await window.electronApi?.plugin.loadDevConfig();
      if (result && (result as any).success) {
        const savedConfig = (result as any).data || {};
        config.value = { ...config.value, ...savedConfig };
      } else if (result && (result as any).error) {
        addLog('error', `加载配置失败: ${(result as any).error}`);
      }
    }
    
    // After loading config, try to load manifest if path exists
    if (config.value.manifestPath) {
      await loadManifestContent();
    }
  } catch (error) {
    addLog('error', `加载配置失败: ${error}`);
  }
}

function addLog(level: LogEntry['level'], message: string) {
  debugLogs.value.push({
    level,
    message,
    timestamp: Date.now()
  });
  
  // 限制日志数量
  if (debugLogs.value.length > 100) {
    debugLogs.value = debugLogs.value.slice(-100);
  }
}

function clearLogs() {
  debugLogs.value = [];
}

function exportLogs() {
  const logsText = debugLogs.value
    .map(log => `[${formatTime(log.timestamp)}] ${log.level.toUpperCase()}: ${log.message}`)
    .join('\n');
  
  const blob = new Blob([logsText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `plugin-dev-logs-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString();
}

onMounted(async () => {
  await loadConfig();
});

onUnmounted(() => {});

defineExpose({
  testLoad,
  saveConfig,
  getConfig: () => ({ ...config.value, pluginId: derivedPluginId.value }),
  getTestPassed: () => !!testPassed.value
});
</script>

<style scoped>
.plugin-dev-tools {
  padding: 24px;
  margin: 0 auto;
}


.config-section {
  margin-bottom: 32px;
  padding: 20px;
  background: var(--td-bg-color-container);
  border-radius: 12px;
  border: 1px solid var(--td-border-color);
}

.config-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.form-group {
  margin-bottom: 20px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--td-text-color-primary);
}

.path-input-group {
  display: flex;
  gap: 8px;
}

.path-input-group .t-input {
  flex: 1;
}

.help-text {
  margin-top: 4px;
  font-size: 12px;
  color: var(--td-text-color-placeholder);
}

.error-message {
  margin-top: 4px;
  font-size: 12px;
  color: var(--td-error-color);
}

.checkbox-group {
  margin-bottom: 16px;
}

.checkbox-group:last-child {
  margin-bottom: 0;
}

.status-section {
  margin-bottom: 32px;
  padding: 20px;
  background: var(--td-bg-color-container);
  border-radius: 12px;
  border: 1px solid var(--td-border-color);
}

.status-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.status-item:last-child {
  margin-bottom: 0;
}

.status-label {
  min-width: 80px;
  font-weight: 500;
  color: var(--td-text-color-secondary);
}

.status-url,
.status-path {
  font-size: 12px;
  color: var(--td-text-color-placeholder);
  font-family: monospace;
}

.actions-section {
  display: flex;
  gap: 12px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.logs-section {
  padding: 20px;
  background: var(--td-bg-color-container);
  border-radius: 12px;
  border: 1px solid var(--td-border-color);
}

.logs-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.logs-container {
  max-height: 300px;
  overflow-y: auto;
  background: var(--td-bg-color-page);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  font-family: monospace;
  font-size: 12px;
}

.log-entry {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
  line-height: 1.4;
}

.log-entry:last-child {
  margin-bottom: 0;
}

.log-time {
  color: var(--td-text-color-placeholder);
  min-width: 80px;
}

.log-level {
  min-width: 50px;
  font-weight: 600;
}

.log-entry.info .log-level {
  color: var(--td-success-color);
}

.log-entry.warn .log-level {
  color: var(--td-warning-color);
}

.log-entry.error .log-level {
  color: var(--td-error-color);
}

.log-entry.debug .log-level {
  color: var(--td-text-color-placeholder);
}

.log-message {
  flex: 1;
  color: var(--td-text-color-primary);
}

.logs-actions {
  display: flex;
  gap: 8px;
}
</style>
