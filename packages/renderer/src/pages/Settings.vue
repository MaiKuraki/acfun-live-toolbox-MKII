<template>
  <div class="settings-page">
    <!-- 顶部标题区域 -->
    <div class="page-header">
      <h1 class="page-title">系统设置</h1>
    </div>

    <!-- 主要内容区域 -->
    <div class="settings-container">
      <!-- 左侧导航 -->
      <div class="settings-nav">
        <div 
          v-for="tab in tabItems" 
          :key="tab.value"
          class="nav-item"
          :class="{ active: activeTab === tab.value }"
          @click="activeTab = tab.value"
        >
          <div class="nav-indicator"></div>
          <span class="nav-text">{{ tab.label }}</span>
        </div>
      </div>

      <!-- 右侧内容 -->
      <div class="settings-content">
        <!-- 通用设置 -->
        <div v-if="activeTab === 'general'" class="settings-panel">
          <div class="panel-section">
            <h3 class="section-title">通用设置</h3>
            <div class="form-group">
              <div class="form-item switch-item">
                <div class="switch-content">
                  <div class="switch-info">
                    <label class="form-label">保持登录</label>
                    <span class="form-description">下次启动时自动登录账号</span>
                  </div>
                  <t-switch v-model="generalSettings.keepLogin" size="large" />
                </div>
              </div>
              <div class="form-item switch-item">
                <div class="switch-content">
                  <div class="switch-info">
                    <label class="form-label">最小化到系统托盘</label>
                    <span class="form-description">关闭窗口时最小化到系统托盘</span>
                  </div>
                  <t-switch v-model="generalSettings.minimizeToTray" size="large" />
                </div>
              </div>
              <div class="form-item switch-item">
                <div class="switch-content">
                  <div class="switch-info">
                    <label class="form-label">开机自启动</label>
                    <span class="form-description">系统启动时自动运行本程序</span>
                  </div>
                  <t-switch v-model="generalSettings.autoStart" size="large" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 网络设置 -->
        <div v-if="activeTab === 'network'" class="settings-panel">
          <div class="panel-section">
            <h3 class="section-title">网络配置</h3>
            <div class="form-group">
              <div class="form-item">
                <div class="input-info-group">
                  <label class="form-label">后端服务端口</label>
                  <span class="form-description">用于插件通信和API服务的端口号</span>
                </div>
                <t-input-number 
                  v-model="networkSettings.serverPort" 
                  :min="1" 
                  :max="65535" 
                  :step="1"
                  theme="row"
                  placeholder="请输入端口号"
                  class="port-input"
                  size="medium"
                  :allow-input-over-limit="false"
                />
                <div class="input-hint">
                  <t-icon name="info-circle" />
                  <span>修改端口后需要重启服务才能生效</span>
                </div>
                <div class="server-status-row">
                  <div class="status-items">
                    <t-tag :theme="serverStatus.running ? 'success' : 'danger'" shape="round" variant="light">
                      {{ serverStatus.running ? '服务运行中' : '服务未运行' }}
                    </t-tag>
                    <t-tag theme="default" shape="round" variant="light">端口：{{ networkSettings.serverPort }}</t-tag>
                  </div>
                  <div class="status-actions">
                    <t-button :loading="restarting" size="small" theme="primary" @click="onRestartServer">
                      重启服务
                    </t-button>
                  </div>
                </div>
                <div v-if="!serverStatus.running && serverStatus.error" class="error-hint">
                  <t-icon name="error-circle" />
                  <span>启动错误：{{ serverStatus.error }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 数据管理 -->
        <div v-if="activeTab === 'data'" class="settings-panel">
          <div class="panel-section">
            <h3 class="section-title">配置管理</h3>
            <div class="form-group">
              <div class="form-item">
                <label class="form-label">配置保存路径</label>
                <div class="path-input-group">
                  <t-input 
                    v-model="configDir" 
                    readonly 
                    class="path-input"
                    placeholder="配置保存路径"
                  />
                  <t-button 
                    variant="outline" 
                    @click="chooseConfigDir"
                    class="path-select-btn"
                  >
                    浏览
                  </t-button>
                </div>
              </div>
              <div class="button-group">
                <t-button variant="outline" @click="openConfigDir" class="action-btn">
                  <template #icon>
                    <t-icon name="folder-open" />
                  </template>
                  打开配置目录
                </t-button>
                <t-button theme="primary" :loading="exportingData" @click="exportConfigZip" class="action-btn">
                  <template #icon>
                    <t-icon name="download" />
                  </template>
                  导出配置
                </t-button>
                <t-button variant="outline" :loading="importingData" @click="importConfigDirect" class="action-btn">
                  <template #icon>
                    <t-icon name="upload" />
                  </template>
                  导入配置
                </t-button>
              </div>
            </div>
          </div>

          <div class="panel-section">
            <h3 class="section-title">数据库路径</h3>
            <div class="form-group">
              <div class="form-item">
                <label class="form-label">数据库文件路径</label>
                <div class="path-input-group">
                  <t-input 
                    v-model="dbPath" 
                    readonly 
                    class="path-input"
                    placeholder="数据库文件路径"
                  />
                  <t-button 
                    variant="outline" 
                    @click="chooseDbFile"
                    class="path-select-btn"
                  >
                    浏览
                  </t-button>
                </div>
                <div class="button-group">
                  <t-button 
                    variant="outline" 
                    @click="openDbFolder"
                    class="action-btn"
                  >
                    <template #icon>
                      <t-icon name="folder-open" />
                    </template>
                    打开所在目录
                  </t-button>
                </div>
              </div>
            </div>
          </div>

          <div class="panel-section">
            <h3 class="section-title">存储占用</h3>
            <div class="storage-stats">
              <div class="storage-overview">
                <div class="storage-total">
                  <span class="total-label">总占用空间</span>
                  <span class="total-value">{{ formatBytes(totalBytes) }}</span>
                </div>
              </div>
              <div class="storage-bar-container">
                <div class="storage-bar">
                  <div class="seg seg-db" :style="{ width: dbPercent + '%' }"></div>
                  <div class="seg seg-config" :style="{ width: configPercent + '%' }"></div>
                  <div class="seg seg-plugins" :style="{ width: pluginsPercent + '%' }"></div>
                </div>
              </div>
              <div class="storage-details">
                <div class="storage-item">
                  <div class="storage-indicator" style="background: var(--td-brand-color)"></div>
                  <span class="storage-label">数据库</span>
                  <span class="storage-value">{{ formatBytes(dbBytes) }}&nbsp;{{ dbPercent }}%</span>
                </div>
                <div class="storage-item">
                  <div class="storage-indicator" style="background: var(--td-success-color)"></div>
                  <span class="storage-label">配置文件</span>
                  <span class="storage-value">{{ formatBytes(configBytes) }}&nbsp;{{ configPercent }}%</span>
                </div>
                <div class="storage-item">
                  <div class="storage-indicator" style="background: var(--td-brand-color-5)"></div>
                  <span class="storage-label">插件文件</span>
                  <span class="storage-value">{{ formatBytes(pluginsBytes) }}&nbsp;{{ pluginsPercent }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 关于 -->
        <div v-if="activeTab === 'about'" class="settings-panel">
          <div class="panel-section">
            <div class="about-info">
              <h3 class="app-name">ACFUN直播框架</h3>
              <div class="app-meta">
                <p class="meta-item">
                  <span class="meta-label">版本：</span>
                  <span class="meta-value">{{ appVersion }}</span>
                </p>
                <p class="meta-item">
                  <span class="meta-label">构建时间：</span>
                  <span class="meta-value">{{ buildTime }}</span>
                </p>
              </div>
              <p class="app-description">{{ toolIntro || '适用于ACFUN的开放式直播框架工具 - 一个功能强大、可扩展的 ACFUN直播框架，提供弹幕收集、数据分析、插件系统等功能' }}</p>
              <div class="app-links">
                <t-button
                  variant="outline"
                  @click="openLink(repoUrl)"
                  class="github-btn"
                >
                  <template #icon>
                    <t-icon name="logo-github" />
                  </template>
                  GitHub
                </t-button>
              </div>
            </div>
          </div>
        </div>

        
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import { debounce } from 'lodash';
import { useNetworkStore } from '../stores/network';

const activeTab = ref('general');

const tabItems = [
  { value: 'general', label: '通用设置' },
  { value: 'network', label: '网络设置' },
  { value: 'data', label: '数据管理' },
  { value: 'about', label: '关于' }
];

const isLoadingConfig = ref(false);
const originalPort = ref(18299);
const portChanged = ref(false);
const serverStatus = ref<{ running: boolean; error?: string; health?: any }>({ running: false });
const restarting = ref(false);

const dotGet = <T,>(obj: any, path: string, def?: T): T => {
  try {
    const parts = String(path).split('.');
    let cur = obj;
    for (const p of parts) {
      if (cur == null) return def as T;
      cur = cur[p];
    }
    return (cur === undefined ? def : cur) as T;
  } catch {
    return def as T;
  }
};

const dotBool = (o: any, p: string, d = false) => Boolean(dotGet(o, p, d));
const dotNum = (o: any, p: string, d = 0) => {
  const v = dotGet(o, p, d);
  const n = parseInt(String(v));
  return Number.isNaN(n) ? d : n;
};
const dotStr = (o: any, p: string, d = '') => String(dotGet(o, p, d) ?? d);

const generalSettings = ref({
  keepLogin: true,
  minimizeToTray: false,
  autoStart: false,
  checkUpdates: false
});





const networkSettings = ref({
  serverPort: 18299
});

// 数据导出相关
const exportOptions = ref({
  format: 'zip',
  includeData: []
});

const configDir = ref('');
const exportingData = ref(false);
const importingData = ref(false);


 

const appVersion = ref('2.0.0');
const buildTime = ref('');
const repoUrl = ref('https://github.com/ACFUN-FOSS/acfun-live-toolbox-MKII');
const toolIntro = ref('');
const dbPath = ref('');
const dbBytes = ref(0);
const configBytes = ref(0);
const pluginsBytes = ref(0);
const totalBytes = ref(0);

const percent = (part: number, total: number) => {
  if (!total || total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round(part * 1000 / total) / 10));
};
const dbPercent = computed(() => percent(dbBytes.value, totalBytes.value));
const configPercent = computed(() => percent(configBytes.value, totalBytes.value));
const pluginsPercent = computed(() => percent(pluginsBytes.value, totalBytes.value));

const formatBytes = (n: number) => {
  try {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
    return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
  } catch {
    return String(n);
  }
};

const openLink = async (url: string) => {
  try {
    const result = await window.electronApi?.system.openExternal(url);
    if (!result.success) {
      console.error('打开链接失败:', result.error);
      MessagePlugin.error('打开链接失败: ' + (result.error || '未知错误'));
    }
  } catch (error) {
    console.error('打开链接异常:', error);
    MessagePlugin.error('打开链接失败: ' + (error instanceof Error ? error.message : String(error)));
  }
};

watch(() => generalSettings.value.keepLogin, () => {
  if (isLoadingConfig.value) return;
  saveSettings({ silent: false });
});

watch(() => generalSettings.value.minimizeToTray, () => {
  if (isLoadingConfig.value) return;
  saveSettings({ silent: false });
});

watch(() => generalSettings.value.autoStart, () => {
  if (isLoadingConfig.value) return;
  saveSettings({ silent: false });
});

watch(() => networkSettings.value.serverPort, (newPort) => {
  if (isLoadingConfig.value) return;
  portChanged.value = newPort !== originalPort.value;
  saveSettings({ silent: false });
});

const doSave = (silent: boolean) => {
  const port = Math.max(1, Math.min(65535, parseInt(String(networkSettings.value.serverPort)) || 18299));
  const payload = {
    'auth.keepLogin': !!generalSettings.value.keepLogin,
    'ui.minimizeToTray': !!generalSettings.value.minimizeToTray,
    'app.autoStart': !!generalSettings.value.autoStart,
    'server.port': port,
    'meta.repoUrl': String(repoUrl.value || '')
  };
  window.electronApi?.system.updateConfig(payload).then((res: any) => {
    if (res && res.success) {
      if (!silent) {
        if (portChanged.value) {
          MessagePlugin.info('网络设置已保存，重启应用或手动重启服务器后生效');
        } else {
          MessagePlugin.success('设置已自动保存');
        }
      }
    } else {
      console.error('配置保存失败:', res?.error);
      MessagePlugin.error(res?.error || '设置保存失败');
    }
  }).catch((error: any) => {
    console.error('配置保存异常:', error);
    MessagePlugin.error('设置保存异常: ' + (error?.message || String(error)));
  });
  if (!isLoadingConfig.value) {
    try {
      window.electronApi?.systemExt.setMinimizeToTray(!!generalSettings.value.minimizeToTray);
    } catch {}
    try {
      window.electronApi?.systemExt.setAutoStart(!!generalSettings.value.autoStart);
    } catch {}
  }
};

const doSaveThrottled = debounce(
  (silent: boolean) => {
    doSave(silent);
  },
  1000,
  { leading: true, trailing: true }
);

const saveSettings = (opts: { silent?: boolean } = {}) => {
  const { silent = false } = opts;
  doSaveThrottled(silent);
};

const loadSettings = () => {
  isLoadingConfig.value = true;
  window.electronApi?.system.getConfig().then((cfg: Record<string, any>) => {
    try {
      const keep = dotBool(cfg, 'auth.keepLogin', true);
      const port = dotNum(cfg, 'server.port', networkSettings.value.serverPort);
      let dir = dotStr(cfg, 'config.dir', '');
      const minimizeToTray = dotBool(cfg, 'ui.minimizeToTray', false);
      const autoStart = dotBool(cfg, 'app.autoStart', false);
      const repo = dotStr(cfg, 'meta.repoUrl', repoUrl.value);

      generalSettings.value.keepLogin = keep;
      generalSettings.value.minimizeToTray = minimizeToTray;
      generalSettings.value.autoStart = autoStart;
      networkSettings.value.serverPort = Number.isNaN(port) ? 18299 : port;
      originalPort.value = networkSettings.value.serverPort; // 保存原始端口值
      if (!dir) {
        try {
          window.electronApi?.system.getUserDataDir().then((res) => {
            if (res && res.success && res.path) {
              configDir.value = res.path;
              (window as any).electronApi?.config.setDir(res.path);
            }
          });
        } catch {}
      } else {
        configDir.value = dir;
      }
      repoUrl.value = repo;
    } catch (error) {
      console.error('配置解析失败:', error);
      MessagePlugin.error('配置加载失败，请检查控制台日志');
    }
  }).catch((error: any) => {
    console.error('获取配置失败:', error);
    MessagePlugin.error('获取配置失败: ' + (error?.message || String(error)));
  }).finally(() => {
    isLoadingConfig.value = false;
  });
};

const refreshServerStatus = async () => {
  try {
    const res = await window.electronApi?.system.serverStatus();
    if (res && res.success) {
      const data = (res as any).data || {};
      serverStatus.value = { running: !!data.running, error: data.error || undefined, health: data.health };
    }
  } catch {}
};

const onRestartServer = async () => {
  try {
    const port = Math.max(1, Math.min(65535, parseInt(String(networkSettings.value.serverPort)) || 18299));
    const changed = port !== originalPort.value;
    if (changed) {
      const ok = await (window as any).electronApi?.popup.confirm('确认重启', '端口已修改，确认后将按新端口重启服务');
      if (!ok) return;
    }
    restarting.value = true;
    const r = await window.electronApi?.system.restartServer(changed ? { port } : undefined);
    if (r && r.success) {
      originalPort.value = port;
      portChanged.value = false;
      try { const ns = useNetworkStore(); await ns.refreshStatus(); } catch {}
      MessagePlugin.success('服务已重启，注意修改obs中浏览器源链接');
    } else {
      MessagePlugin.error((r as any)?.error || '重启失败');
    }
    await refreshServerStatus();
  } catch (e: any) {
    MessagePlugin.error(e?.message || String(e));
  } finally {
    restarting.value = false;
  }
};

const chooseConfigDir = async () => {
  const res = await window.electronApi?.dialog.showOpenDialog({ properties: ['openDirectory'] });
  if (res && !res.canceled && Array.isArray(res.filePaths) && res.filePaths.length > 0) {
    configDir.value = res.filePaths[0];
    try { await window.electronApi?.config.setDir(configDir.value); } catch {}
    MessagePlugin.info('已保存配置目录，重启后完全生效');
  }
};

const openConfigDir = () => {
  if (!configDir.value) return;
  window.electronApi?.system.showItemInFolder(configDir.value);
};

const chooseDbFile = async () => {
  try {
    const res = await window.electronApi?.dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: '数据库文件', extensions: ['db'] }] });
    const fp = Array.isArray(res?.filePaths) && res.filePaths[0] ? String(res.filePaths[0]) : '';
    if (!fp) return;
    const r = await (window as any).electronApi?.db.setPath(fp);
    if (r && r.success) {
      dbPath.value = fp;
      MessagePlugin.info('数据库路径已更新，重启后完全生效');
    } else {
      MessagePlugin.error(r?.error || '更新数据库路径失败');
    }
  } catch {}
};

const openDbFolder = () => {
  if (!dbPath.value) return;
  window.electronApi?.system.showItemInFolder(dbPath.value);
};

const exportConfigZip = async () => {
  exportingData.value = true;
  try {
    const suggested = `config-${new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16)}.zip`;
    const save = await window.electronApi?.dialog.showSaveDialog({ title: '导出配置', defaultPath: suggested, filters: [{ name: 'ZIP', extensions: ['zip'] }] });
    const filePath = (save as any)?.filePath || (save as any)?.path;
    if (!filePath) { exportingData.value = false; return; }
    const api: any = (window as any).electronApi;
    const out = await api.config?.exportZip(String(filePath));
    if (out && out.success) MessagePlugin.success('配置导出成功'); else MessagePlugin.error(out?.error || '配置导出失败');
  } catch {
    MessagePlugin.error('配置导出失败');
  } finally {
    exportingData.value = false;
  }
};

const importConfigDirect = async () => {
  importingData.value = true;
  try {
    const res = await window.electronApi?.dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: '配置包', extensions: ['zip'] }] });
    const fp = Array.isArray(res?.filePaths) && res.filePaths[0] ? String(res.filePaths[0]) : '';
    if (!fp) { importingData.value = false; return; }
    const api: any = (window as any).electronApi;
    const r = await api.config?.importZip(fp);
    if (r && r.success) {
      MessagePlugin.success('配置导入成功');
    } else {
      MessagePlugin.error(r?.error || '配置导入失败');
    }
  } catch {
    MessagePlugin.error('配置导入失败');
  } finally {
    importingData.value = false;
  }
};

onMounted(() => {
  loadSettings();
  refreshServerStatus();
  try {
    window.electronApi?.system.getBuildInfo().then((info: any) => {
      try {
        if (info && info.success) {
          const ts = typeof info.buildTime === 'number' ? info.buildTime : Date.now();
          buildTime.value = new Date(ts).toLocaleString();
          if (info.version) appVersion.value = String(info.version);
        } else {
          buildTime.value = '未知';
        }
      } catch {}
    });
  } catch {}
  try {
    (window as any).electronApi?.db.getPath().then((res: any) => { if (res && res.success) dbPath.value = String(res.path || ''); });
  } catch {}
  try {
    (window as any).electronApi?.system.getStorageStats().then((res: any) => {
      if (res && res.success) {
        dbBytes.value = Number(res.dbBytes || 0);
        configBytes.value = Number(res.configBytes || 0);
        pluginsBytes.value = Number(res.pluginsBytes || 0);
        totalBytes.value = Number(res.totalBytes || 0);
      }
    });
  } catch {}
  try {
    window.electronApi?.system.getReadmeSummary().then((res) => {
      if (res && res.success && res.summary) {
        toolIntro.value = res.summary;
      } else {
        toolIntro.value = '适用于ACFUN的开放式直播框架工具 - 一个功能强大、可扩展的 AcFun 直播工具框架，提供弹幕收集、数据分析、插件系统等功能';
      }
    });
  } catch {
    toolIntro.value = '适用于ACFUN的开放式直播框架工具 - 一个功能强大、可扩展的 AcFun 直播工具框架，提供弹幕收集、数据分析、插件系统等功能';
  }
});
</script>

<style scoped>
/* Professional Settings Page Design */
.settings-page { height: calc(100vh - 100px); display: flex; flex-direction: column; padding: 16px; background: var(--td-bg-color-page); overflow: hidden; }

/* Page Header */
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

.page-subtitle {
  margin: 0;
  font-size: 14px;
  color: var(--td-text-color-secondary);
  font-weight: 400;
}

.server-status-row { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; }
.status-items { display: flex; gap: 8px; align-items: center; }
.status-actions { display: flex; align-items: center; }
.error-hint { display: flex; gap: 8px; align-items: center; color: var(--td-error-color); margin-top: 8px; }

/* Settings Container */
.settings-container { flex: 1; display: flex; gap: 16px; min-height: 0; }

/* Left Navigation */
.settings-nav {
  width: 200px;
  background: var(--td-bg-color-container);
  border-radius: 8px;
  padding: 8px;
  border: 1px solid var(--td-border-level-1-color);
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 4px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.nav-item:hover {
  background: var(--td-bg-color-container-hover);
}

.nav-item.active {
  background: var(--td-brand-color-1);
}

.nav-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 16px;
  background: var(--td-brand-color);
  border-radius: 0 2px 2px 0;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.nav-item.active .nav-indicator {
  opacity: 1;
}

.nav-text {
  font-size: 14px;
  color: var(--td-text-color-primary);
  font-weight: 500;
  margin-left: 8px;
}

.nav-item.active .nav-text {
  color: var(--td-brand-color);
}

/* Right Content */
.settings-content { flex: 1; background: var(--td-bg-color-container); border-radius: 8px; border: 1px solid var(--td-border-level-1-color); display: flex; flex-direction: column; min-height: 0; }

.settings-panel { flex: 1; padding: 16px; overflow-y: auto; }

/* Panel Sections */
.panel-section { margin-bottom: 16px; }

.panel-section:last-child {
  margin-bottom: 0;
}

.section-title { margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: var(--td-text-color-primary); }

/* Form Elements */
.form-group { display: flex; flex-direction: column; gap: 16px; }

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 600px;
}

.form-label {
  font-size: 14px;
  color: var(--td-text-color-primary);
  font-weight: 500;
  line-height: 1.4;
}

.form-description {
  font-size: 12px;
  color: var(--td-text-color-secondary);
  line-height: 1.4;
  margin-top: 2px;
}

/* Switch Item Layout */
.switch-item {
  background: var(--td-bg-color-secondarycontainer);
  padding: 16px;
  border-radius: 8px;
  border: 1px solid var(--td-border-level-1-color);
  transition: all 0.2s ease;
}

.switch-item:hover {
  border-color: var(--td-brand-color);
  background: var(--td-bg-color-container-hover);
}

.switch-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.switch-info {
  flex: 1;
}

.switch-info .form-label {
  margin-bottom: 4px;
  display: block;
}

/* Input Info Group */
.input-info-group {
  margin-bottom: 8px;
}

.input-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 12px;
  color: var(--td-text-color-secondary);
}

.input-hint .t-icon {
  font-size: 14px;
  color: var(--td-brand-color);
}

/* Path Input Group */
.path-input-group {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.path-input {
  flex: 1;
  font-size: 13px;
  font-family: 'SF Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  color: var(--td-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

/* Text Overflow Utilities */
.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.text-ellipsis-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.text-ellipsis-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.path-select-btn {
  padding: 8px 16px;
  color: var(--td-brand-color);
  border: 1px solid var(--td-border-level-1-color);
  border-radius: 6px;
  background: var(--td-bg-color-container);
  transition: all 0.2s ease;
  font-size: 13px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 36px;
  white-space: nowrap;
  line-height: 1;
}

.path-select-btn:hover {
  color: var(--td-brand-color-hover);
  border-color: var(--td-brand-color);
  background: var(--td-brand-color-1);
}

/* Button Groups */
.button-group { 
  display: flex; 
  gap: 12px; 
  margin-top: 12px; 
  flex-wrap: wrap;
}

.action-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

/* Storage Stats - Apple Style Design */
.storage-stats { 
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0;
}

.storage-overview {
  text-align: left;
  padding: 0;
  background: transparent;
  border: none;
  margin-bottom: 4px;
}

.storage-total {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.total-label {
  font-size: 13px;
  color: var(--td-text-color-secondary);
  font-weight: 400;
  margin-bottom: 4px;
}

.total-value {
  font-size: 20px;
  color: var(--td-text-color-primary);
  font-weight: 600;
  line-height: 1.1;
}

.storage-bar-container {
  padding: 0;
  margin: 8px 0;
}

.storage-bar { 
  height: 8px; 
  display: flex; 
  border-radius: 4px; 
  overflow: hidden; 
  background: var(--td-bg-color-secondary); 
  border: none;
}

.storage-bar .seg { 
  height: 100%; 
  transition: width 0.3s ease;
  position: relative;
}

.seg-db { background: var(--td-brand-color); }
.seg-config { background: var(--td-success-color); }
.seg-plugins { background: var(--td-brand-color-5); }

.storage-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 12px;
}

.storage-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
  background: transparent;
  border-radius: 0;
  border: none;
  transition: all 0.2s ease;
}

.storage-item:hover {
  border-color: var(--td-brand-color);
  background: var(--td-bg-color-container-hover);
}

.storage-indicator {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  flex-shrink: 0;
  margin-right: 8px;
}

.storage-label {
  flex: 1;
  font-size: 13px;
  color: var(--td-text-color-primary);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.storage-value {
  font-size: 14px;
  color: var(--td-text-color-secondary);
  font-weight: 400;
  text-align: right;
  white-space: nowrap;
}

/* Port Input */
.port-input {
  width: 200px;
  font-size: 14px;
  font-weight: 500;
}

/* Protect number input from global CSS pollution - Use TDesign default styles */
.port-input :deep(.t-input-number) {
  width: 100% !important;
  font: var(--td-font-body-medium) !important;
  color: var(--td-text-color-primary) !important;
}

/* Ensure TDesign input-number controls are visible */
.port-input :deep(.t-input-number--row) {
  width: 100% !important;
}

.port-input :deep(.t-input-number__decrease),
.port-input :deep(.t-input-number__increase) {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: pointer !important;
}

/* File Upload */
.file-upload {
  width: 100%;
}

/* About Section */
.about-info {
  max-width: 600px;
}

.app-name {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.app-meta { margin-bottom: 12px; }

.meta-item {
  margin: 8px 0;
  font-size: 14px;
  color: var(--td-text-color-secondary);
}

.meta-label {
  color: var(--td-text-color-secondary);
  margin-right: 8px;
}

.meta-value {
  color: var(--td-text-color-primary);
  font-weight: 500;
}

.app-description {
  margin: 0 0 32px 0;
  font-size: 14px;
  color: var(--td-text-color-secondary);
  line-height: 1.6;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  max-height: 4.8em;
}

.app-links {
  display: flex;
  gap: 12px;
}

.github-btn {
  display: flex;
  align-items: center;
  gap: 4px;
}



/* Custom Switch Styling */
:deep(.t-switch) {
  transform: scale(1.1);
  align-self: flex-start;
}

/* Input Enhancements */
:deep(.t-input),
:deep(.t-input-number) {
  border-radius: 6px;
  border: 1px solid var(--td-border-level-1-color);
  transition: all 0.2s ease;
  font-size: 14px;
}

:deep(.t-input:hover),
:deep(.t-input-number:hover) {
  border-color: var(--td-brand-color);
}

:deep(.t-input:focus),
:deep(.t-input-number:focus) {
  border-color: var(--td-brand-color);
  box-shadow: 0 0 0 2px var(--td-brand-color-focus);
}

:deep(.t-input--readonly) {
  background: var(--td-bg-color-secondarycontainer);
  color: var(--td-text-color-secondary);
}

/* Enhanced Section Styling */
.panel-section {
  background: var(--td-bg-color-container);
  border: 1px solid var(--td-border-level-1-color);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  transition: all 0.2s ease;
}

.panel-section:last-child {
  margin-bottom: 0;
}

.panel-section:hover {
  border-color: var(--td-brand-color-3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--td-text-color-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title::before {
  content: '';
  width: 4px;
  height: 16px;
  background: var(--td-brand-color);
  border-radius: 2px;
}



:deep(.t-button-variant-outline) {
  border: 1px solid var(--td-border-level-1-color);
  color: var(--td-text-color-primary);
  background: var(--td-bg-color-container);
}

:deep(.t-button-variant-outline:hover) {
  border-color: var(--td-brand-color);
  color: var(--td-brand-color);
  background: var(--td-brand-color-1);
}

:deep(.t-button-variant-outline:active) {
  background: var(--td-brand-color-2);
}

:deep(.t-button-theme-primary) {
  font-weight: 600;
}

/* Fix TDesign button content alignment */
:deep(.t-button__content) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  line-height: 1;
}

:deep(.t-button__content .t-icon) {
  flex-shrink: 0;
  font-size: 14px;
  line-height: 1;
}

/* Upload Styling */
:deep(.t-upload__file-input) {
  border-radius: 6px;
  border: 1px solid var(--td-border-level-1-color);
}

:deep(.t-upload__file-input:hover) {
  border-color: var(--td-brand-color);
}

/* Responsive Design */
@media (max-width: 768px) {
  .settings-container {
    flex-direction: column;
  }
  
  .settings-nav {
    width: 100%;
    display: flex;
    overflow-x: auto;
    padding: 8px;
  }
  
  .nav-item {
    flex-shrink: 0;
    margin-right: 8px;
    margin-bottom: 0;
  }
  
  .button-group {
    flex-direction: column;
  }
  
  .action-btn {
    width: 100%;
    justify-content: center;
  }
  
  .storage-details {
    gap: 8px;
  }
  
  .storage-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .storage-value,
  .storage-percent {
    text-align: left;
    min-width: auto;
  }
  
  .path-input-group {
    flex-direction: column;
    align-items: stretch;
  }
  
  .path-input {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .settings-page {
    padding: 12px;
  }
  
  .page-title {
    font-size: 20px;
  }
  
  .panel-section {
    padding: 16px;
  }
  
  .switch-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .switch-info {
    width: 100%;
  }
}
</style>
