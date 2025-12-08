<template>
  <div class="plugin-management-page">
    <div class="page-header">
      <h2>插件管理</h2>
      <div class="header-actions">
        <t-dropdown :options="addPluginOptions">
          <t-button theme="primary">
            <template #icon>
              <t-icon name="add" />
            </template>
            添加插件
          </t-button>
        </t-dropdown>
        <t-button
          variant="outline"
          @click="openPluginFolder"
        >
          <template #icon>
            <t-icon name="folder" />
          </template>
          插件目录
        </t-button>
        <t-dropdown :options="batchOpsOptions">
          <t-button variant="outline">
            <template #icon>
              <t-icon name="save" />
            </template>
            批量操作
          </t-button>
        </t-dropdown>
      </div>
    </div>


    <!-- 过滤栏已移除；搜索迁移至列表卡片头部 -->

    <!-- 插件列表 -->
    <t-card
      class="plugin-list-card"
      title="插件列表"
      hover-shadow
    >
      <template #actions>
        <div class="list-header-actions">
          <t-input 
            v-model="searchKeyword" 
            placeholder="搜索插件名称或描述..." 
            clearable
            style="width: 260px;"
          >
            <template #prefix-icon>
              <t-icon name="search" />
            </template>
          </t-input>
        </div>
      </template>
      <div
        v-if="pluginStore.isLoading"
        class="loading-state"
      >
        <t-loading />
        <span>加载插件列表中...</span>
      </div>

      <div
        v-else-if="filteredPlugins.length === 0"
        class="empty-state"
      >
        <t-icon
          name="plugin"
          size="48px"
        />
        <p>{{ searchKeyword ? '未找到匹配的插件' : '暂无插件' }}</p>
        <t-button
          v-if="!searchKeyword"
          theme="primary"
          @click="showInstallDialog = true"
        >
          安装第一个插件
        </t-button>
      </div>

  <div
        v-else
        class="plugin-grid"
      >
        <div 
          v-for="plugin in filteredPlugins" 
          :key="plugin.id"
          class="plugin-card"
          :class="{ 
            active: plugin.status === 'active',
            inactive: plugin.status === 'inactive',
            error: plugin.status === 'error'
          }"
        >
          <div class="plugin-header">
            <div class="plugin-icon">
              <img
                v-if="plugin.icon"
                :src="plugin.icon"
                :alt="plugin.name"
                @error="handleIconError(plugin)"
              >
              <t-icon
                v-else-if="isDebugPlugin(plugin.id)"
                :name="getRandomIcon(plugin.id)"
                size="32px"
              />
              <t-icon
                v-else
                name="plugin"
                size="32px"
              />
            </div>
            <div class="plugin-info">
              <div class="plugin-name">
                {{ plugin.name }}
              </div>
              <div class="plugin-version">
                v{{ plugin.version }}
              </div>
            </div>
          <div class="plugin-status">
            <t-tag :theme="getStatusTheme(plugin.status)">
              <template #icon>
                <t-icon :name="getStatusIcon(plugin.status)" />
              </template>
              {{ getStatusText(plugin.status) }}
            </t-tag>
            <t-tag
              v-if="isDebugPlugin(plugin.id)"
              theme="warning"
              variant="light"
              size="small"
              class="debug-badge"
            >
              调试插件
            </t-tag>
          </div>
          </div>

          <div class="plugin-description">
            {{ plugin.description || '暂无描述' }}
          </div>

          <div class="plugin-meta">
            <div class="meta-item">
              <t-icon name="user" />
              <span>{{ plugin.author || '未知作者' }}</span>
            </div>
            <div class="meta-item">
              <t-icon name="time" />
              <span>{{ formatInstallTime(plugin.installTime) }}</span>
            </div>
          </div>

          <div class="plugin-actions">
            <t-button 
              v-if="canViewPlugin(plugin.id)"
              size="small"
              theme="primary"
              variant="outline"
              @click="viewPlugin(plugin)"
            >
              打开面板
            </t-button>
            <t-button
              size="small"
              variant="outline"
              @click="viewPluginDetails(plugin)"
            >
              查看详情
            </t-button>
            <t-button
              v-if="canCopyOverlay(plugin.id)"
              size="small"
              variant="outline"
              @click="copyOverlayLink(plugin)"
            >
              复制链接
            </t-button>
            <t-button 
              size="small" 
              :theme="plugin.status === 'active' ? 'danger' : 'primary'"
              @click="togglePlugin(plugin)"
            >
              {{ plugin.status === 'active' ? '禁用' : '启用' }}
            </t-button>
            <t-dropdown :options="getPluginMenuOptions(plugin)" :min-column-width="140">
              <t-button
                size="small"
                variant="text"
              >
                <t-icon name="more" />
              </t-button>
            </t-dropdown>
          </div>
        </div>
      </div>
    </t-card>

    <!-- 安装插件对话框（仅本地文件） -->
    <t-dialog 
      v-model:visible="showInstallDialog" 
      :header="false"
      width="600px"
      @confirm="installPlugin"
      @cancel="resetInstallForm"
    >
      <div class="install-form">
        <t-form
          ref="installFormRef"
          :data="installForm"
          :rules="installFormRules"
          layout="vertical"
        >
          <t-form-item
            label="插件文件"
            name="filePath"
          >
            <t-input 
              v-model="installForm.filePath"
              placeholder="选择插件压缩包（.zip/.tar/.tgz/.gz）"
            >
              <template #suffix>
                <t-button size="small" @click="pickPluginFile">选择文件</t-button>
              </template>
            </t-input>
          </t-form-item>
        </t-form>
      </div>
    </t-dialog>

    

    <!-- 插件详情对话框（全屏） -->
    <t-dialog 
      class="dialog-fullscreen"
      v-model:visible="showDetailDialog" 
      :title="`插件详情 - ${selectedPlugin?.name || ''}`"
      :close-on-overlay-click="true"
      :destroy-on-close="true"
      mode="full-screen"
      :footer="false"
    >
      <PluginDetail 
        v-if="showDetailDialog && selectedPlugin" 
        :plugin-id="selectedPlugin.id"
        @back="showDetailDialog = false"
        @pluginUpdated="async () => { await pluginStore.refreshPlugins(); }"
      />
      <div class="dialog-footer-back">
        <t-button theme="primary" variant="outline" @click="showDetailDialog = false">返回</t-button>
      </div>
    </t-dialog>

    <!-- 调试工具对话框 -->
    <t-dialog
      v-model:visible="showDevToolsDialog"
      title="插件开发工具"
      width="800px"
      mode="full-screen"
      :footer="false"
    >  <div class="dev-tools-header">
      <h3>插件开发工具</h3>
      <p class="description">
        配置外部Vue/React项目进行插件开发和调试
      </p>
    </div>
      <PluginDevTools ref="devToolsRef" />
      <div class="dialog-footer-actions">
        <t-button variant="outline" :loading="testingDev" @click="onTestLoad">测试加载</t-button>
        <t-button variant="outline" @click="onCancelDevPlugin">取消</t-button>
        <t-button theme="primary" :disabled="!canConfirmDev" :loading="confirmingDev" @click="onConfirmDevPlugin">确认</t-button>
      </div>
    </t-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, h, resolveComponent } from 'vue';
import { useRouter } from 'vue-router';
import { usePluginStore } from '../stores/plugin';
import type { PluginInfo } from '../stores/plugin';
import PluginDetail from '../components/PluginDetail.vue';
import PluginDevTools from '../components/PluginDevTools.vue';
import { resolvePrimaryHostingType, buildOverlayWrapperBase } from '../utils/hosting';
import { copyText } from '../utils/format';

const pluginStore = usePluginStore();
const router = useRouter();


// 响应式状态
const searchKeyword = ref('');
const showInstallDialog = ref(false);
const showDetailDialog = ref(false);
const showDevToolsDialog = ref(false);
const devToolsRef = ref<any>(null);
const testingDev = ref(false);
const confirmingDev = ref(false);
const canConfirmDev = ref(false);
const selectedPlugin = ref<PluginInfo | null>(null);

// 调试插件识别：加载开发工具配置映射
const devConfigMap = ref<Record<string, any>>({});
const isDebugPlugin = (pluginId: string) => {
  return !!devConfigMap.value && !!devConfigMap.value[pluginId];
};

// 取消 mock：严格依赖插件提供的 manifest.config

// 安装相关状态
const installForm = ref({
  filePath: ''
});
const installFormRef = ref();
const installFormRules = {
  filePath: [{ required: true, message: '请选择插件文件', type: 'error' }]
};

// 已移除在线安装与插件商店逻辑，统一仅支持本地文件安装

// 计算属性
const filteredPlugins = computed(() => {
  let plugins = pluginStore.plugins;
  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    plugins = plugins.filter(plugin => 
      plugin.name.toLowerCase().includes(keyword) ||
      plugin.description?.toLowerCase().includes(keyword) ||
      plugin.author?.toLowerCase().includes(keyword)
    );
  }

  return plugins;
});

// 不再需要商店筛选逻辑

// 方法
const refreshPlugins = async () => {
  await pluginStore.refreshPlugins();
};

let hasRefreshedOnce = false;
onMounted(async () => {
  if (!hasRefreshedOnce) {
    await refreshPlugins();
    hasRefreshedOnce = true;
  }
});

const addPluginOptions = [
  { content: '从文件安装', value: 'install', onClick: () => { showInstallDialog.value = true; } },
  { content: '添加调试插件', value: 'debug', onClick: () => { showDevToolsDialog.value = true; } }
];

const batchOpsOptions = [
  { content: '批量备份配置', value: 'backup', onClick: () => backupAllConfigs() },
  { content: '批量导入配置', value: 'import', onClick: () => importAllConfigs() }
];

// 视图打开支持：为插件预解析主托管类型（ui/window），用于显示“查看”按钮
const primaryHostingMap = ref<Record<string, 'ui' | 'window' | null>>({});

const loadPrimaryHostingFor = async (pluginId: string) => {
  try {
    // 若已有缓存，跳过
    if (pluginId in primaryHostingMap.value) return;
    const primary = await resolvePrimaryHostingType(pluginId);
    primaryHostingMap.value[pluginId] = primary.type;
  } catch (e) {
    console.warn('[plugin-view] 解析主托管失败:', pluginId, e);
    primaryHostingMap.value[pluginId] = null;
  }
};

const preloadPrimaryHostingForVisible = async () => {
  const ids = filteredPlugins.value.map(p => p.id);
  await Promise.all(ids.map(id => loadPrimaryHostingFor(id)));
};

const canViewPlugin = (pluginId: string) => {
  const plugin = pluginStore.plugins.find(p => p.id === pluginId);
  if (!plugin || !plugin.enabled || plugin.status !== 'active') {
    return false;
  }
  // 未解析时尝试触发解析；避免阻塞渲染
  if (!(pluginId in primaryHostingMap.value)) {
    // 异步填充，首次渲染可能暂时不显示“查看”按钮
    void loadPrimaryHostingFor(pluginId);
    return false;
  }
  return primaryHostingMap.value[pluginId] !== null;
};

const canCopyOverlay = (pluginId: string) => {
  const plugin = pluginStore.plugins.find(p => p.id === pluginId);
  if (!plugin || !plugin.enabled || plugin.status !== 'active') {
    return false;
  }
  return !!plugin.hasOverlay;
};

const viewPlugin = async (plugin: PluginInfo) => {
  try {
    if (!plugin.enabled || plugin.status !== 'active') {
      console.warn('[plugin-view] 插件处于禁用或非活动状态，禁止查看:', plugin.id);
      return;
    }
    const primary = await resolvePrimaryHostingType(plugin.id);
    if (!primary.type) {
      console.warn('[plugin-view] 插件无 ui/window 托管入口，无法查看:', plugin.id);
      return;
    }
  if (primary.type === 'ui') {
    // 导航到框架页以加载 UI（匹配 router.ts: /plugins/:plugname）
    router.push(`/plugins/${plugin.id}`);
    return;
  }
  if (primary.type === 'window') {
    // 打开插件独立窗口（单实例），无需切换主窗口路由
    await window.electronApi.plugin.window.open(plugin.id);
    return;
  }
  } catch (err) {
    console.error('[plugin-view] 查看插件失败:', err);
  }
};

const copyOverlayLink = async (plugin: PluginInfo) => {
  try {
    if (!plugin.enabled || plugin.status !== 'active') {
      console.warn('[plugin-overlay] 插件处于禁用或非活动状态，禁止复制链接:', plugin.id);
      return;
    }
    // 直接构建外部包装页基础链接（插件级消息中心）
    const finalUrl = buildOverlayWrapperBase(plugin.id);
    await copyText(finalUrl);
  } catch (err) {
    console.error('[plugin-overlay] 复制链接失败:', err);
  }
};

const getStatusTheme = (status: string) => {
  switch (status) {
    case 'active': return 'success';
    case 'inactive': return 'default';
    case 'error': return 'danger';
    default: return 'default';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'active': return 'check-circle';
    case 'inactive': return 'close-circle';
    case 'error': return 'error-circle';
    default: return 'help-circle';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'active': return '已启用';
    case 'inactive': return '已禁用';
    case 'error': return '错误';
    default: return '未知';
  }
};

// 图标加载失败时回退到默认图标
const handleIconError = (plugin: PluginInfo) => {
  try {
    plugin.icon = '' as any;
  } catch (e) {
    console.warn('[plugin-management] 图标加载失败，使用默认图标:', e);
  }
};

const formatInstallTime = (timestamp: Date | number | undefined) => {
  if (!timestamp) return '未知';
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return date.toLocaleDateString();
};

const togglePlugin = async (plugin: PluginInfo) => {
  try {
    await pluginStore.togglePlugin(plugin.id, !plugin.enabled);
  } catch (error) {
    console.error('切换插件状态失败:', error);
  }
};


  async function importPluginConfig(plugin: PluginInfo) {
    try {
      const pick = await window.electronApi.dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'JSON', extensions: ['json'] }]
      });
      const file = (pick && pick.filePaths && pick.filePaths[0]) || '';
      if (!file) return;
      const content = await window.electronApi.fs.readFile(file);
      const parsed = JSON.parse(String(content || '{}'));
      validateSingleConfig(plugin, parsed);
      const res = await window.electronApi.plugin.updateConfig(plugin.id, parsed);
      if (res && (res as any).success) {
        await pluginStore.refreshPlugins();
        try { (await import('../services/globalPopup')).GlobalPopup.toast('配置已导入'); } catch {}
      }
    } catch (err) {
      console.error('[plugin-config] 导入失败:', err);
      try { (await import('../services/globalPopup')).GlobalPopup.alert('导入失败', String((err as Error)?.message || err)); } catch {}
    }
  }

  function validateSingleConfig(plugin: PluginInfo, cfg: any) {
    if (!cfg || typeof cfg !== 'object' || Array.isArray(cfg)) throw new Error('配置必须为对象');
    const schema = (plugin.config || {}) as any;
    for (const key of Object.keys(cfg)) {
      const def = schema[key];
      const val = cfg[key];
      if (!def) continue; // 允许额外字段但忽略
      const t = (def && def.type) || typeof (def.default ?? def.value);
      if (t === 'boolean' && typeof val !== 'boolean') throw new Error(`字段 ${key} 需要布尔值`);
      if (t === 'number' && typeof val !== 'number') throw new Error(`字段 ${key} 需要数字`);
      if (t === 'select' || t === 'text' || t === 'string') { if (typeof val !== 'string') throw new Error(`字段 ${key} 需要字符串`); }
    }
  }

  async function backupAllConfigs() {
    const list = pluginStore.plugins;
    const data: Record<string, any> = {};
    for (const p of list) {
      try {
        const res = await window.electronApi.plugin.getConfig(p.id);
        if (res && (res as any).success) data[p.id] = (res as any).data || {};
      } catch {}
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plugins-config-backup.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importAllConfigs() {
    try {
      const pick = await window.electronApi.dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'JSON', extensions: ['json'] }] });
      const file = (pick && pick.filePaths && pick.filePaths[0]) || '';
      if (!file) return;
      const content = await window.electronApi.fs.readFile(file);
      const parsed = JSON.parse(String(content || '{}'));
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('批量导入文件必须为对象映射');
      for (const p of pluginStore.plugins) {
        const cfg = parsed[p.id];
        if (!cfg) continue;
        try { validateSingleConfig(p, cfg); await window.electronApi.plugin.updateConfig(p.id, cfg); } catch (e) { console.warn('[batch-import] 跳过', p.id, e); }
      }
      await pluginStore.refreshPlugins();
      try { (await import('../services/globalPopup')).GlobalPopup.toast('批量导入完成'); } catch {}
    } catch (err) {
      console.error('[batch-import] 失败:', err);
      try { (await import('../services/globalPopup')).GlobalPopup.alert('批量导入失败', String((err as Error)?.message || err)); } catch {}
    }
  }

  const getPluginMenuOptions = (plugin: PluginInfo) => {
    const hasParsed = plugin.id in primaryHostingMap.value;
    const supports = hasParsed && primaryHostingMap.value[plugin.id] !== null;
    const renderIndentedLabel = (text: string, indent: boolean) => {
      return indent
        ? h(
            'div',
            { style: 'display:flex;align-items:center;' },
            [
              h('span', { style: 'display:inline-block;width:24px;' }),
              h('span', text)
            ]
          )
        : text;
    };
    const checkboxNode = supports
      ? h(
          resolveComponent('t-checkbox') as any,
          {
            modelValue: isInSidebar(plugin),
            disabled: !plugin.enabled,
            onChange: (checked: boolean) => {
              if (!plugin.enabled) return;
              toggleSidebarCheckbox(plugin, !!checked);
            }
          },
          { default: () => '在侧边栏显示' }
        )
      : null;
    const checkboxContainer = supports && checkboxNode
      ? h(
          'div',
          {
            style: 'display:flex;align-items:center;',
            onClick: (e: Event) => { e.stopPropagation(); },
            onMousedown: (e: Event) => { e.stopPropagation(); }
          },
          [checkboxNode]
        )
      : null;

    const liveCheckboxNode = supports
      ? h(
          resolveComponent('t-checkbox') as any,
          {
            modelValue: isInLiveRoom(plugin),
            disabled: !plugin.enabled,
            onChange: (checked: boolean) => {
              if (!plugin.enabled) return;
              toggleLiveRoomCheckbox(plugin, !!checked);
            }
          },
          { default: () => '在直播间显示' }
        )
      : null;
    const liveCheckboxContainer = supports && liveCheckboxNode
      ? h(
          'div',
          {
            style: 'display:flex;align-items:center;',
            onClick: (e: Event) => { e.stopPropagation(); },
            onMousedown: (e: Event) => { e.stopPropagation(); }
          },
          [liveCheckboxNode]
        )
      : null;

    const options: any[] = [
      // 仅在支持 ui/window 能力时展示复选框项
      ...(supports
        ? [
            { content: checkboxContainer, value: 'sidebar-display', disabled: !plugin.enabled },
            { content: liveCheckboxContainer, value: 'live-display', disabled: !plugin.enabled }
          ]
        : []),
      {
        content: renderIndentedLabel('重新加载', supports),
        value: 'reload',
        onClick: () => reloadPlugin(plugin)
      },
      {
        content: renderIndentedLabel('导出配置', supports),
        value: 'export',
        onClick: () => exportPluginConfig(plugin)
      },
      {
        content: renderIndentedLabel('导入配置', supports),
        value: 'import',
        onClick: () => importPluginConfig(plugin)
      },
      {
        content: renderIndentedLabel('卸载插件', supports),
        value: 'uninstall',
        theme: 'error',
        onClick: () => uninstallPlugin(plugin)
      }
    ];

    return options;
  };

  const viewPluginDetails = (plugin: PluginInfo) => {
  selectedPlugin.value = plugin;
  showDetailDialog.value = true;
};

// 侧边栏显示复选框状态与持久化
const isInSidebar = (plugin: PluginInfo) => {
  return !!(plugin.sidebarDisplay && plugin.sidebarDisplay.show);
};

const toggleSidebarCheckbox = (plugin: PluginInfo, checked: boolean) => {
  try {
    const current = plugin.sidebarDisplay || {} as any;
    pluginStore.updatePluginSidebarDisplay(plugin.id, { ...current, show: checked });
  } catch (err) {
    console.error('[plugin-management] 更新侧边栏显示失败:', err);
  }
};

const isInLiveRoom = (plugin: PluginInfo) => {
  return !!(plugin.liveRoomDisplay && plugin.liveRoomDisplay.show);
};

const toggleLiveRoomCheckbox = (plugin: PluginInfo, checked: boolean) => {
  try {
    const current = plugin.liveRoomDisplay || ({} as any);
    pluginStore.updatePluginLiveRoomDisplay(plugin.id, { ...current, show: checked });
  } catch (err) {
    console.error('[plugin-management] 更新直播间显示失败:', err);
  }
};

const reloadPlugin = async (plugin: PluginInfo) => {
  try {
    await pluginStore.reloadPlugin(plugin.id);
  } catch (error) {
    console.error('重新加载插件失败:', error);
  }
};

const exportPluginConfig = (plugin: PluginInfo) => {
  const config = JSON.stringify(plugin.config, null, 2);
  const blob = new Blob([config], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${plugin.id}_config.json`;
  a.click();
  URL.revokeObjectURL(url);
};

const uninstallPlugin = async (plugin: PluginInfo) => {
  try {
    await pluginStore.uninstallPlugin(plugin.id);
  } catch (error) {
    console.error('卸载插件失败:', error);
    try { (await import('../services/globalPopup')).GlobalPopup.alert('卸载失败', String((error as Error)?.message || error)); } catch {}
  }
};

const installPlugin = async () => {
  const valid = await installFormRef.value?.validate();
  if (!valid) return false;

  try {
    const filePath = installForm.value.filePath;
    if (!filePath) return false;
    await pluginStore.installPluginFromFilePath(filePath);
    showInstallDialog.value = false;
    resetInstallForm();
    await refreshPlugins();
  } catch (error) {
    console.error('安装插件失败:', error);
  }
};

// 商店安装功能已移除

const resetInstallForm = () => {
  installForm.value = {
    filePath: ''
  };

  installFormRef.value?.clearValidate();
};

const pickPluginFile = async () => {
  try {
    const res = await window.electronApi.dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Plugin Package', extensions: ['zip', 'tgz', 'tar', 'gz'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    if (res && Array.isArray(res.filePaths) && res.filePaths[0]) {
      installForm.value.filePath = res.filePaths[0];
    }
  } catch (error) {
    console.error('选择插件文件失败:', error);
  }
};





const openPluginFolder = async () => {
  try {
    await window.electronApi.plugin.openPluginsDir();
  } catch (error) {
    console.error('Failed to open plugins folder:', error);
    try { (await import('../services/globalPopup')).GlobalPopup.alert('打开失败', String((error as Error)?.message || error)); } catch {}
  }
};

function getRandomIcon(id: string) {
  const pool = ['user', 'time', 'folder', 'plugin', 'search', 'save', 'check-circle', 'error-circle'];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return pool[hash % pool.length];
}

async function onTestLoad() {
  try {
    testingDev.value = true;
    const result = await devToolsRef.value?.testLoad?.();
    const passed = !!(result?.pass ?? devToolsRef.value?.getTestPassed?.());
    canConfirmDev.value = passed;
    const msg = passed ? '测试加载通过' : `测试加载失败：${String(result?.error || '未知原因')}`;
    try { (await import('../services/globalPopup')).GlobalPopup.toast(msg); } catch {}
  } finally {
    testingDev.value = false;
  }
}

async function onConfirmDevPlugin() {
  try {
    confirmingDev.value = true;
    await devToolsRef.value?.saveConfig?.();
    try { await pluginStore.refreshPlugins(); } catch {}
    showDevToolsDialog.value = false;
  } finally {
    confirmingDev.value = false;
  }
}

function onCancelDevPlugin() {
  showDevToolsDialog.value = false;
}

// 生命周期
onMounted(() => {
  // 预加载当前可见插件的主托管类型
  preloadPrimaryHostingForVisible();
  // 加载调试配置映射：存在配置即视为“调试插件”
  (async () => {
    try {
      const res = await window.electronApi.plugin.loadDevConfig();
      if (res && 'success' in res && (res as any).success) {
        devConfigMap.value = (((res as any).data) as Record<string, any>) || {};
      } else {
        devConfigMap.value = {};
        if (res && (res as any).error) {
          console.warn('[devtools] loadDevConfig error:', (res as any).error);
        }
      }
    } catch (e) {
      console.warn('[devtools] loadDevConfig exception:', e);
      devConfigMap.value = {};
    }
  })();
});

// 当过滤结果变化时（搜索或刷新），增量解析新增插件的主托管类型
watch(filteredPlugins, async (list, prev) => {
  const prevIds = new Set((prev || []).map(p => p.id));
  for (const p of list) {
    if (!prevIds.has(p.id)) {
      void loadPrimaryHostingFor(p.id);
    }
  }
});
</script>

<style scoped>


.dev-tools-header {
 padding-top: 24px;
 padding-left: 24px;
  margin-bottom: 32px;
}

.dev-tools-header h3 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.description {
  margin: 0;
  color: var(--td-text-color-secondary);
  font-size: 14px;
}

.plugin-management-page {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  overflow: hidden;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-header h2 {
  margin: 0;
  color: var(--td-text-color-primary);
}

.header-actions {
  display: flex;
  gap: 8px;
}

/* 统一按钮内图标与文字垂直居中对齐 */
.header-actions :deep(.t-button) {
  display: inline-flex;
  align-items: center;
}
.header-actions :deep(.t-button .t-icon) {
  line-height: 1;
}

.list-header-actions {
  display: flex;
  align-items: center;
}

.plugin-list-card {
  flex: 1;
  min-height: 0;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px;
  color: var(--td-text-color-secondary);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: var(--td-text-color-secondary);
}

.empty-state p {
  margin: 16px 0;
}

.plugin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  max-height: 500px;
  overflow-y: auto;
}

.dialog-footer-back {
  position: fixed;
  right: 16px;
  bottom: 16px;
}

.dialog-footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 12px;
}

.plugin-card {
  border: 1px solid var(--td-border-level-1-color);
  border-radius: 8px;
  padding: 16px;
  background-color: var(--td-bg-color-container);
  transition: all 0.2s;
}

.plugin-card:hover {
  border-color: var(--td-brand-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.plugin-card.active {
  border-color: var(--td-success-color);
}

.plugin-card.error {
  border-color: var(--td-error-color);
}

.plugin-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.plugin-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.plugin-icon img {
  width: 100%;
  height: 100%;
  border-radius: 4px;
  object-fit: cover;
}

.plugin-info {
  flex: 1;
  min-width: 0;
}

.plugin-name {
  font-weight: 500;
  color: var(--td-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.plugin-version {
  font-size: 12px;
  color: var(--td-text-color-secondary);
}

.plugin-description {
  color: var(--td-text-color-secondary);
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.plugin-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--td-text-color-secondary);
}

.plugin-actions {
  display: flex;
  gap: 8px;
}

.debug-badge {
  margin-left: 8px;
}

.install-form {
  padding: 16px 0;
}

.plugin-store {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 400px;
}

.store-plugins {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
}

.store-plugin-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--td-border-level-1-color);
  border-radius: 6px;
  background-color: var(--td-bg-color-container);
}

.store-plugin-info {
  flex: 1;
  min-width: 0;
}

.store-plugin-name {
  font-weight: 500;
  color: var(--td-text-color-primary);
}

.store-plugin-description {
  font-size: 14px;
  color: var(--td-text-color-secondary);
  margin: 4px 0;
}

.store-plugin-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--td-text-color-placeholder);
}

.plugin-config {
  max-height: 400px;
  overflow-y: auto;
}

/* 配置表单：令标题与控件分行显示，长标题自动换行 */
.plugin-config :deep(.t-form__item) {
  display: block;
}
.plugin-config :deep(.t-form__label) {
  display: block;
  width: 100% !important;
  white-space: normal;
  margin-bottom: 6px;
}
.plugin-config :deep(.t-form__controls) {
  display: block;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  
  .plugin-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
}

@media (max-width: 768px) {
  
  .plugin-grid {
    grid-template-columns: 1fr;
  }
  
  .page-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
