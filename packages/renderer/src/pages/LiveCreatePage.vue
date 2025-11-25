<!-- eslint-disable vue/no-v-model-argument -->
<template>
  <div class="live-create-page">
    <!-- 权限验证状态 -->
    <div v-if="permissionLoading" class="permission-check">
      <t-loading />
      <span>正在检测开播权限...</span>
    </div>

    <!-- 无权限提示 -->
    <div v-else-if="!hasPermission" class="permission-denied">
      <t-icon name="error-circle" size="48px" />
      <h3>无开播权限</h3>
      <p>您当前没有开播权限，请联系管理员或完成相关认证</p>
      <t-button theme="primary" @click="goBack">返回</t-button>
    </div>

    <!-- 主要内容区域 -->
    <div v-else class="create-content">
      <div class="page-header">
        <h2>创建直播</h2>
        <p class="subtitle">填写直播信息，开始您的直播之旅</p>
      </div>

      <!-- 单页布局：左侧基本信息，右侧推流设置 -->
      <div class="single-page-layout">
        <!-- 左侧：基本信息 -->
        <div class="left-panel">
          <t-card title="基本信息" class="basic-info-card">
            <t-form ref="basicFormRef" :data="basicForm" :rules="basicRules" layout="vertical" label-width="0">
              <!-- 直播标题 -->
              <div class="form-section">
                <h4 class="section-title">直播标题</h4>
                <t-form-item name="title">
                  <t-input
                    v-model="basicForm.title"
                    placeholder="请输入直播标题"
                    :maxlength="50"
                    show-limit-number
                    aria-label="直播标题输入框"
                  />
                </t-form-item>
              </div>

              <!-- 直播分类 -->
              <div class="form-section">
                <h4 class="section-title">直播分类</h4>
                <t-form-item name="category">
                  <t-cascader
                    v-model:value="basicForm.category"
                    :options="cascaderOptions"
                    value-type="full"
                    placeholder="请选择直播分类"
                    :loading="categoriesLoading"
                    filterable
                    clearable
                    aria-label="直播分类选择器"
                    @change="onCategoryChange"
                  />
                </t-form-item>
              </div>

              <!-- 封面图片 -->
              <div class="form-section">
                <h4 class="section-title">封面图片</h4>
                <t-form-item name="cover">
                  <div class="cover-upload-section">
<t-upload
  v-model:files="files"
  accept="image/*"
  :max="1"
  :auto-upload="false"
  placeholder="点击上传图片文件"
  theme="image"
  draggable
  @change="onUploadChange"
/>
                </div>
              </t-form-item>
            </div>

              <!-- 直播模式 -->
              <div class="form-section">
                <h4 class="section-title">直播模式</h4>
                <t-form-item name="mode">
                  <t-radio-group v-model="basicForm.mode" aria-label="直播模式选择">
                    <t-radio :value="'portrait'">竖屏</t-radio>
                    <t-radio :value="'landscape'">横屏</t-radio>
                  </t-radio-group>
                </t-form-item>
              </div>
            </t-form>
          </t-card>
        </div>

        <!-- 右侧：推流设置 -->
        <div class="right-panel">
          <t-card title="推流地址" class="stream-card">
            <div v-if="streamLoading" class="stream-loading">
              <t-loading />
              <span>正在获取推流地址...</span>
            </div>

            <div v-else-if="streamInfo" class="stream-info">
              <div class="stream-fields">
                <t-form-item label="服务器地址（RTMP）">
                  <t-input :value="streamInfo.rtmpUrl" readonly>
                    <template #suffix>
                      <t-button variant="text" @click="copyStreamUrl">
                        <t-icon name="copy" />
                      </t-button>
                      <t-button variant="text" @click="refreshStreamInfo" :disabled="streamLoading">
                        <t-icon name="refresh" />
                      </t-button>
                    </template>
                  </t-input>
                </t-form-item>

                <t-form-item label="串流密钥">
                  <t-input :value="streamInfo.streamKey || '创建直播后生成'" readonly :type="streamInfo.streamKey ? 'password' : 'text'">
                    <template #suffix>
                      <t-button variant="text" @click="copyStreamKey" :disabled="!streamInfo.streamKey">
                        <t-icon name="copy" />
                      </t-button>
                      <t-button variant="text" @click="refreshStreamInfo" :disabled="streamLoading">
                        <t-icon name="refresh" />
                      </t-button>
                    </template>
                  </t-input>
                </t-form-item>
              </div>

              <div class="obs-guide">
                <h4>OBS设置</h4>
                <p>按以下步骤配置并开始推流：</p>
                <ul>
                  <li>设置 → 推流 → 服务选择“自定义”</li>
                  <li>填写服务器地址与串流密钥后开始推流</li>
                  <li>回到本页，等待检测状态变为“推流正常”</li>
                </ul>
              </div>
            </div>

            <div v-else-if="streamError" class="stream-error">
              <t-alert :theme="streamError.type" :message="streamError.message" />
              <t-button theme="primary" @click="retryGetStreamInfo">重新获取</t-button>
            </div>
          </t-card>


        </div>
      </div>

      <!-- 底部操作按钮 -->
      <div class="bottom-actions">
        <t-button 
          size="large"
          :theme="streamStatus === 'streaming' ? 'success' : 'primary'"
          :loading="startLiveLoading || streamStatus === 'connecting'"
          :disabled="streamStatus !== 'streaming' || startLiveLoading"
          @click="startLive"
          aria-label="开始直播"
          class="start-live-btn"
        >
          <template v-if="!(startLiveLoading || streamStatus === 'connecting')">
            <t-icon :name="getStreamStatusIcon(streamStatus)" />
          </template>
          {{ getStreamStatusText(streamStatus) }}
        </t-button>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
/* eslint-disable vue/no-v-model-argument */
import { ref, reactive, computed, onMounted, nextTick, watch, onActivated, onDeactivated, onUnmounted } from 'vue';
import { useRoute } from 'vue-router'
import { useRouter } from 'vue-router';
import { MessagePlugin } from 'tdesign-vue-next';
import { useAccountStore } from '../stores/account';
import { useStreamStore } from '../stores/stream';
import { getApiBase } from '../utils/hosting';
import type { UploadFile } from 'tdesign-vue-next';

// 接口类型定义
interface Category {
  categoryID: number;
  categoryName: string;
  subCategoryID: number;
  subCategoryName: string;
}

interface CascaderOption {
  value: number;
  label: string;
  children?: CascaderOption[];
}

interface StreamInfo {
  rtmpUrl: string;
  streamKey: string;
  expiresAt: number;
}

interface TranscodeInfo {
  streamURL: {
    url: string;
    bitrate: number;
    qualityType: string;
    qualityName: string;
  };
  resolution: string;
  frameRate: number;
  template: string;
}

// 路由和状态
const router = useRouter();
const route = useRoute();
const accountStore = useAccountStore();

// 权限验证状态
const permissionLoading = ref(true);
const hasPermission = ref(false);

// 单页布局控制
const nextStepLoading = ref(false);

// 基本信息表单
const basicFormRef = ref();
const basicForm = reactive({
  title: '',
  category: [] as (string | number)[],
  cover: '',
  mode: 'landscape' as 'portrait' | 'landscape'
});

onActivated(() => {
  try {
    if (streamCheckTimer.value) {
      clearInterval(streamCheckTimer.value);
      streamCheckTimer.value = null;
    }
    startStreamStatusCheck();
  } catch {}
});

onDeactivated(() => {
  try {
    if (streamCheckTimer.value) {
      clearInterval(streamCheckTimer.value);
      streamCheckTimer.value = null;
    }
  } catch {}
});

const DRAFT_KEY = 'LIVE_CREATE_BASIC_FORM_V1';
let draftTimer: any = null;
const isRestoringDraft = ref(true);

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    console.log('[LiveCreateDraft] loadDraft raw:', raw);
    if (!raw) return;
    const data = JSON.parse(raw);
    console.log('[LiveCreateDraft] loadDraft parsed:', data);
    if (data && typeof data === 'object') {
      if (typeof data.title === 'string') basicForm.title = data.title;
      if (Array.isArray(data.category)) {
        basicForm.category = [...data.category] as (string | number)[];
      } else if (typeof data.category === 'string' || typeof data.category === 'number') {
        basicForm.category = [data.category];
      } else {
        basicForm.category = [];
      }
      if (typeof data.cover === 'string') basicForm.cover = data.cover;
      if (data.mode === 'portrait' || data.mode === 'landscape') basicForm.mode = data.mode;
    }
    console.log('[LiveCreateDraft] after loadDraft basicForm:', { ...basicForm });
  } catch (e) {
    console.warn('[LiveCreateDraft] loadDraft error:', e);
  }
}

function saveDraft() {
  if (isRestoringDraft.value) return;
  if (draftTimer) clearTimeout(draftTimer);
  draftTimer = setTimeout(() => {
    console.log('[LiveCreateDraft] saveDraft basicForm.category:', basicForm.category, 'type:', typeof basicForm.category, 'isArray:', Array.isArray(basicForm.category), 'length:', basicForm.category?.length);
    let existing: any = {};
    try { existing = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}'); } catch {}
    const payload: any = { ...existing };
    if (basicForm.title && basicForm.title.trim().length > 0) payload.title = basicForm.title;
    
    // 始终保存 category，即使是空数组
    if (Array.isArray(basicForm.category)) {
      payload.category = [...basicForm.category];
      console.log('[LiveCreateDraft] saveDraft - including category (array):', basicForm.category);
    } else if (typeof (basicForm as any).category === 'string' || typeof (basicForm as any).category === 'number') {
      payload.category = [(basicForm as any).category];
      console.log('[LiveCreateDraft] saveDraft - including category (scalar):', (basicForm as any).category);
    } else {
      payload.category = [];
      console.log('[LiveCreateDraft] saveDraft - category not set, default []');
    }
    
    if (basicForm.cover && basicForm.cover.trim().length > 0) payload.cover = basicForm.cover;
    payload.mode = basicForm.mode || existing.mode || 'landscape';
    try { 
      localStorage.setItem(DRAFT_KEY, JSON.stringify(payload)); 
      console.log('[LiveCreateDraft] saveDraft payload:', payload);
    } catch (e) {
      console.warn('[LiveCreateDraft] saveDraft error:', e);
    }
  }, 300);
}

function normalizeCategoryDraft() {
  console.log('[LiveCreateDraft] normalizeCategoryDraft input:', basicForm.category, 'options:', cascaderOptions.value.length);
  
  // 如果当前没有分类且存在可用选项，才设置默认值
  if (!Array.isArray(basicForm.category) || basicForm.category.length === 0) {
    if (cascaderOptions.value.length > 0) {
      const first = cascaderOptions.value[0];
      if (first.children && first.children.length > 0) {
        basicForm.category = [first.value, first.children[0].value as number];
      } else {
        basicForm.category = [first.value];
      }
      console.log('[LiveCreateDraft] normalizeCategoryDraft set default:', basicForm.category);
    }
    return;
  }
  
  if (cascaderOptions.value.length === 0) return;
  
  const [cat, sub] = basicForm.category as (string | number)[];
  const category = cascaderOptions.value.find(c => c.value === cat);
  if (!category) {
    const first = cascaderOptions.value[0];
    if (first.children && first.children.length > 0) {
      basicForm.category = [first.value, first.children[0].value as number];
    } else {
      basicForm.category = [first.value];
    }
    console.log('[LiveCreateDraft] normalizeCategoryDraft fallback:', basicForm.category);
    return;
  }
  if (sub && category.children && category.children.length > 0) {
    const subOk = category.children.some(s => s.value === sub);
    if (!subOk) {
      basicForm.category = [category.value, category.children[0].value as number];
      console.log('[LiveCreateDraft] normalizeCategoryDraft sub fallback:', basicForm.category);
    }
  }
  console.log('[LiveCreateDraft] normalizeCategoryDraft result:', basicForm.category);
}

const basicRules = {
  title: [
    { required: true, message: '请输入直播标题' },
    { min: 2, max: 50, message: '标题长度应在 2-50 个字符之间' }
  ],
  category: [
    { required: true, message: '请选择直播分类' }
  ],
  cover: [
    { required: true, message: '请上传封面图片' }
  ]
};

// 分类数据
const categoriesLoading = ref(false);
const categories = ref<Category[]>([]);
const cascaderOptions = ref<CascaderOption[]>([]);

// 封面上传（简化版）
const files = ref<UploadFile[]>([]);
const coverPreviewUrl = ref('');

async function fileToBase64(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}

function onUploadChange(changed: UploadFile[]) {
  const f = Array.isArray(changed) && changed.length > 0 ? changed[0] : undefined;
  if (f && (f as any).raw instanceof File) {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = String(reader.result);
      basicForm.cover = base64;
      files.value = [{ url: base64, name: (f as any).name || 'cover.jpg', status: 'success' } as any];
    };
    reader.readAsDataURL((f as any).raw as File);
  } else if (f && typeof (f as any).url === 'string' && (f as any).url) {
    basicForm.cover = (f as any).url;
    files.value = [{ url: (f as any).url, name: (f as any).name || 'cover.jpg', status: 'success' } as any];
  } else {
    basicForm.cover = '';
    files.value = [];
  }
}

// 推流信息
const streamLoading = ref(false);
const streamInfo = ref<StreamInfo | null>(null);
const streamError = ref<{ type: string; message: string } | null>(null);

// 推流状态监测
const streamStatus = ref<'waiting' | 'connecting' | 'streaming' | 'error'>('waiting');
const transcodeInfo = ref<TranscodeInfo[]>([]);
const streamCheckTimer = ref<NodeJS.Timeout | null>(null);
const transcodeStreamName = ref<string>('');

// 开始直播
const startLiveLoading = ref(false);
const startLiveStatus = ref<{ type: 'success' | 'error'; message: string } | null>(null);
const liveId = ref<string>('');

// 计算属性：是否可以开始直播
const canStartLive = computed(() => {
  return streamStatus.value === 'streaming';
});

// 图片裁剪
// 裁剪已移除

// 生命周期
onMounted(async () => {
  console.log('[LiveCreateDraft] onMounted starting...');
  loadDraft();
  if (basicForm.cover) {
    files.value = [{ url: basicForm.cover, name: 'cover.jpg', status: 'success' } as any];
  }
  const streamStore = useStreamStore()
  await checkLivePermission();
  try {
    const statusRes = await window.electronApi.http.get('/api/acfun/live/stream-status');
    if (statusRes && statusRes.success && statusRes.data && statusRes.data.liveID) {
      router.replace(`/live/manage/${statusRes.data.liveID}`);
      return;
    }
  } catch {}
  if (hasPermission.value) {
    await loadCategories();
    normalizeCategoryDraft();
    await loadStreamInfo();
    try {
      await (streamStore as any).setStreamInfo({ rtmpUrl: streamInfo.value?.rtmpUrl, streamKey: streamInfo.value?.streamKey, expiresAt: streamInfo.value?.expiresAt })
      await (streamStore as any).syncReadonlyStore()
    } catch {}
  }
  isRestoringDraft.value = false;
  console.log('[LiveCreateDraft] onMounted completed, isRestoringDraft:', isRestoringDraft.value);
});

watch(basicForm, (newVal, oldVal) => {
  console.log('[LiveCreateDraft] basicForm changed:', {
    old: { category: oldVal?.category, title: oldVal?.title, cover: oldVal?.cover },
    new: { category: newVal?.category, title: newVal?.title, cover: newVal?.cover }
  });
  saveDraft();
}, { deep: true });

// 专门监听category数组变化
watch(() => basicForm.category, (newCategory, oldCategory) => {
  console.log('[LiveCreateDraft] category array changed:', {
    old: oldCategory,
    new: newCategory,
    oldLength: oldCategory?.length,
    newLength: newCategory?.length,
    isSameRef: oldCategory === newCategory
  });
}, { deep: true });

// 权限检测
async function checkLivePermission() {
  try {
    permissionLoading.value = true;
    
    const result = await window.electronApi.http.get('/api/acfun/live/permission');
    hasPermission.value = result.success && result.data?.liveAuth;
    
    if (!hasPermission.value && result.data?.message) {
      await MessagePlugin.warning(result.data.message);
    }
  } catch (error) {
    console.error('权限检测失败:', error);
    hasPermission.value = false;
    await MessagePlugin.error('权限检测失败，请检查网络连接或稍后重试');
  } finally {
    permissionLoading.value = false;
  }
}

// 加载分类
async function loadCategories() {
  try {
    categoriesLoading.value = true;
    
    const result = await window.electronApi.http.get('/api/acfun/live/categories');
    if (result.success && result.data) {
      categories.value = result.data;
      
      // 转换为级联选择器格式
      const categoryMap = new Map<number, CascaderOption>();
      
      result.data.forEach((item: Category) => {
        if (!categoryMap.has(item.categoryID)) {
          categoryMap.set(item.categoryID, {
            value: item.categoryID,
            label: item.categoryName,
            children: []
          });
        }
        
        const category = categoryMap.get(item.categoryID)!;
        if (item.subCategoryID && item.subCategoryName) {
          category.children!.push({
            value: item.subCategoryID,
            label: item.subCategoryName
          });
        }
      });
      
      cascaderOptions.value = Array.from(categoryMap.values());
    } else {
      throw new Error(result.error || '获取分类失败');
    }
  } catch (error) {
    console.error('加载分类失败:', error);
    await MessagePlugin.error('加载分类失败，请检查网络连接或稍后重试');
  } finally {
    categoriesLoading.value = false;
  }
}

// 获取分类名称（从级联选择器值）
function getCategoryNames() {
  if (!basicForm.category || !Array.isArray(basicForm.category) || basicForm.category.length === 0) {
    return { categoryName: '', subCategoryName: '' };
  }
  
  const [categoryId, subCategoryId] = basicForm.category;
  const category = cascaderOptions.value.find(c => c.value === categoryId);
  
  if (!category) {
    return { categoryName: '', subCategoryName: '' };
  }
  
  const categoryName = category.label;
  let subCategoryName = '';
  
  if (subCategoryId && category.children) {
    const subCategory = category.children.find(s => s.value === subCategoryId);
    subCategoryName = subCategory ? subCategory.label : '';
  }
  
  return { categoryName, subCategoryName };
}

// 封面上传处理
const beforeCoverUpload = (file: any) => {
  const isImage = file.type === 'image/jpeg' || file.type === 'image/jpg' || file.type === 'image/png';
  const isLt5M = file.size / 1024 / 1024 < 5;
  
  if (!isImage) {
    MessagePlugin.error('只能上传 JPG/PNG 格式的图片!');
    return false;
  }
  if (!isLt5M) {
    MessagePlugin.error('图片大小不能超过 5MB!');
    return false;
  }
  return true;
};

async function handleCoverSuccess(response: any, file: UploadFile) {
  try {
    if (file.raw) {
      // 读取文件为base64并直接存储到表单
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        // 直接存储base64到表单
        basicForm.cover = base64;
        MessagePlugin.success('封面图片已加载');
      };
      if (file?.raw instanceof File) reader.readAsDataURL(file.raw);
    } else if (response && response.url) {
      // 如果已经有URL，直接使用
      basicForm.cover = response.url;
      MessagePlugin.success('封面上传成功');
    }
  } catch (error) {
    console.error('封面加载失败:', error);
    MessagePlugin.error(error instanceof Error ? error.message : '封面加载失败，请重试');
  }
}

function handleCoverError() {
  MessagePlugin.error('封面上传失败，请重试');
}

function handleCoverRemove() {
  basicForm.cover = '';
}

function removeCover() {
  handleCoverRemove();
}

// 处理封面文件变化
async function handleCoverChange(files: UploadFile[]) {
  if (files.length > 0 && files[0].raw) {
    const file = files[0];
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      (file as any).url = base64;
      // 直接存储base64到表单
      basicForm.cover = base64;
    };
    if (file?.raw instanceof File) reader.readAsDataURL(file.raw);
  } else {
    basicForm.cover = '';
  }
}

function openCropFromFile(file: UploadFile) {
  // 已移除裁剪对话框
}

// 获取推流信息（仅获取服务器地址与当前状态，不创建直播）
async function getStreamInfo() {
  try {
    streamLoading.value = true;
    streamError.value = null;
    
    // 获取推流设置（服务器地址等）
    {
      const base = getApiBase();
      const url = new URL('/api/acfun/live/stream-settings', base);
      console.log('[LiveCreate][REQ]', 'GET', url.toString());
    }
    const settingsResult = await window.electronApi.http.get('/api/acfun/live/stream-settings');
    if (!settingsResult.success || !settingsResult.data) {
      throw new Error(settingsResult.error || '获取推流设置失败');
    }
    console.log('[LiveCreate][RESP] stream-settings:', JSON.stringify(settingsResult, null, 2));
    
    const pushList = settingsResult.data.streamPushAddress || [];
    const firstPush = Array.isArray(pushList) && pushList.length > 0 ? pushList[0] : '';
    console.log('[LiveCreate] firstPush raw:', firstPush);
    
    const splitPush = splitRtmpUrlAndKey(firstPush);
    console.log('[LiveCreate] splitPush result:', splitPush);
    
    let rtmpUrl = formatRtmpServer(splitPush.server || firstPush) || 'rtmp://live.acfun.cn/live';
    let streamKey = splitPush.key || settingsResult.data.streamName || '';
    const nameCandidate = (settingsResult.data.streamName || '') || ((splitPush.key || '').split('?')[0]);
    transcodeStreamName.value = nameCandidate || '';
    console.log('[LiveCreate] pushList:', pushList, 'firstPush:', firstPush, 'rtmpUrl:', rtmpUrl, 'streamKey:', streamKey);

    // 若可获取用户的 liveId，则尝试拉取正式的 stream-url（包含签名参数），无需开播
    try {
      const userId = accountStore?.userInfo?.userID;
      if (userId) {
        {
          const base = getApiBase();
          const url = new URL('/api/acfun/live/user-info', base);
          url.searchParams.set('userID', String(userId));
          console.log('[LiveCreate][REQ]', 'GET', url.toString());
        }
        const info = await window.electronApi.http.get('/api/acfun/live/user-info', { userID: userId });
        console.log('[LiveCreate][RESP] user-info:', info);
        if (info.success && info.data?.liveID) {
          {
            const base = getApiBase();
            const url = new URL('/api/acfun/live/stream-url', base);
            url.searchParams.set('liveId', info.data.liveID);
            console.log('[LiveCreate][REQ]', 'GET', url.toString());
          }
          const urlRes = await window.electronApi.http.get('/api/acfun/live/stream-url', { liveId: info.data.liveID });
          console.log('[LiveCreate][RESP] stream-url by liveId:', JSON.stringify(urlRes, null, 2));
          if (urlRes.success && urlRes.data?.rtmpUrl) {
            const split = splitRtmpUrlAndKey(urlRes.data.rtmpUrl);
            console.log('[LiveCreate][PARSE] split from stream-url:', split);
            console.log('[LiveCreate] Before update - rtmpUrl:', rtmpUrl, 'streamKey:', streamKey);
            rtmpUrl = split.server || rtmpUrl;
            streamKey = split.key || streamKey;
            console.log('[LiveCreate] After update - rtmpUrl:', rtmpUrl, 'streamKey:', streamKey);
          }
        }
      }
    } catch {}
    
  streamInfo.value = {
      rtmpUrl,
      streamKey,
      expiresAt: Date.now() + 3600000
    };
    console.log('[LiveCreate][FINAL] streamInfo:', streamInfo.value);
    
    startStreamStatusCheck();
  } catch (error) {
    console.error('获取推流地址失败:', error);
    streamError.value = {
      type: 'error',
      message: error instanceof Error ? error.message : '获取推流地址失败，请检查网络连接或稍后重试'
    };
  } finally {
    streamLoading.value = false;
  }
}

// 推流状态检测
async function startStreamStatusCheck() {
  // 清除之前的定时器
  if (streamCheckTimer.value) {
    clearInterval(streamCheckTimer.value);
  }
  
  // 检查登录态
  try {
    const auth = await window.electronApi.http.get('/api/acfun/auth/status');
    if (!auth.success || !auth.data?.authenticated) {
      console.log('[LiveCreate][STATUS] Not authenticated, skip status polling');
      streamStatus.value = 'waiting';
      return;
    }
  } catch (e) {
    console.warn('[LiveCreate][STATUS] Auth status check failed:', e);
  }
  if (!transcodeStreamName.value) {
    streamStatus.value = 'waiting';
    return;
  }
  
  // 开始轮询检测
  streamCheckTimer.value = setInterval(async () => {
    try {
      const result = await window.electronApi.http.get('/api/acfun/live/transcode-info', { streamName: transcodeStreamName.value });
      if (result.success && Array.isArray(result.data)) {
        const list = result.data as TranscodeInfo[];
        if (list.length > 0) {
          transcodeInfo.value = list;
          streamStatus.value = 'streaming';
          console.log('[LiveCreate][STATUS] streaming, canStartLive=', canStartLive.value);
        } else {
          streamStatus.value = 'connecting';
          transcodeInfo.value = [];
          console.log('[LiveCreate][STATUS] connecting, canStartLive=', canStartLive.value);
        }
      } else {
        streamStatus.value = 'connecting';
        transcodeInfo.value = [];
        console.log('[LiveCreate][STATUS] error/empty, canStartLive=', canStartLive.value, 'error=', result.error);
        
        if (result.error?.includes('token') || result.error?.includes('认证') || result.error?.includes('cookies')) {
          if (streamCheckTimer.value) {
            clearInterval(streamCheckTimer.value);
            streamCheckTimer.value = null;
          }
        }
      }
    } catch (error) {
      console.warn('[LiveCreate][STATUS] Transcode check failed:', error);
      console.log('[LiveCreate][STATUS] exception, canStartLive=', canStartLive.value);
    }
  }, 5000); // 5秒检测一次
}

// 获取推流信息（页面加载时自动获取）
async function loadStreamInfo() {
  try {
    nextStepLoading.value = true;
    await getStreamInfo();
  } catch (error) {
    console.error('获取推流信息失败:', error);
  } finally {
    nextStepLoading.value = false;
  }
}

 

 

// 路由兜底：当进入 /live/create 时强制重启检测；离开时清理定时器
watch(() => route.fullPath, async (fp) => {
  try {
    if (fp && fp.startsWith('/live/create')) {
      if (streamCheckTimer.value) { clearInterval(streamCheckTimer.value); streamCheckTimer.value = null; }
      try {
        const statusRes = await window.electronApi.http.get('/api/acfun/live/stream-status');
        if (statusRes && statusRes.success && statusRes.data && statusRes.data.liveID) {
          router.replace(`/live/manage/${statusRes.data.liveID}`);
          return;
        }
      } catch {}
      streamStatus.value = 'connecting';
      await getStreamInfo();
    } else {
      if (streamCheckTimer.value) { clearInterval(streamCheckTimer.value); streamCheckTimer.value = null; }
    }
  } catch (e) {
    console.warn('[LiveCreate] route watch restart error:', e);
  }
}, { immediate: false });

function goBack() {
  router.back();
}

 

// 复制推流地址
function copyStreamUrl() {
  if (streamInfo.value) {
    navigator.clipboard.writeText(streamInfo.value.rtmpUrl);
    MessagePlugin.success('服务器地址已复制');
  }
}

function copyStreamKey() {
  if (streamInfo.value) {
    if (streamInfo.value.streamKey) {
      navigator.clipboard.writeText(streamInfo.value.streamKey);
      MessagePlugin.success('串流密钥已复制');
    } else {
      MessagePlugin.warning('请先在“开始直播”步骤创建直播以生成密钥');
    }
  }
}

// 格式化过期时间
function formatExpiry(timestamp: number) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  
  if (diff <= 0) return '已过期';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}小时${minutes}分钟后过期`;
}

// 获取推流状态图标
function getStreamStatusIcon(status: string) {
  switch (status) {
    case 'waiting': return 'time';
    case 'connecting': return 'loading';
    case 'streaming': return 'check-circle';
    case 'error': return 'error-circle';
    default: return 'info-circle';
  }
}

// 获取推流状态颜色
function getStreamStatusColor(status: string) {
  switch (status) {
    case 'waiting': return '#999';
    case 'connecting': return '#ff9800';
    case 'streaming': return '#4caf50';
    case 'error': return '#f44336';
    default: return '#999';
  }
}

// 获取推流状态文本（按钮显示）
function getStreamStatusText(status: string) {
  switch (status) {
    case 'waiting': return '等待推流';
    case 'connecting': return '检测推流中...';
    case 'streaming': return '开始直播';
    case 'error': return '推流失败';
    default: return '未知状态';
  }
}

// 获取推流状态描述
function getStreamStatusDesc(status: string) {
  switch (status) {
    case 'waiting': return '请在 OBS 中开始推流';
    case 'connecting': return '正在检测推流状态...';
    case 'streaming': return '推流正常，可以开始直播';
    case 'error': return '推流出现异常，请检查设置';
    default: return '';
  }
}

// 重试获取推流信息
function retryGetStreamInfo() {
  streamError.value = null;
  getStreamInfo();
}

// 打开 OBS 指南
function openObsGuide() {
  // TODO: 打开 OBS 设置指南页面或弹窗
  MessagePlugin.info('OBS 设置指南功能开发中');
}

// 开始直播
async function startLive() {
  try {
    // 验证表单
    if (!basicForm.title) {
      MessagePlugin.error('请输入直播标题');
      return;
    }
    if (!basicForm.category || basicForm.category.length === 0) {
      MessagePlugin.error('请选择直播分类');
      return;
    }
    if (!basicForm.cover) {
      MessagePlugin.error('请上传封面图片');
      return;
    }

    startLiveLoading.value = true;
    startLiveStatus.value = null;
    
    let categoryID = basicForm.category?.[0] || 0;
    let subCategoryID = basicForm.category?.[1] || 0;
    if ((!categoryID || !subCategoryID) && cascaderOptions.value.length > 0) {
      const firstCategory = cascaderOptions.value[0];
      if (firstCategory.children && firstCategory.children.length) {
        categoryID = firstCategory.value as number;
        subCategoryID = firstCategory.children[0].value as number;
        basicForm.category = [categoryID, subCategoryID];
      }
    }
    
    console.log('[LiveCreate][START] Creating live stream...');
    console.log('[LiveCreate][START] Form data:', {
      title: basicForm.title,
      coverLength: basicForm.cover.length,
      coverType: typeof basicForm.cover,
      categoryID,
      subCategoryID
    });

    const coverToSend = basicForm.cover || '';
    console.log('[LiveCreate][START] coverToSend length:', coverToSend.length);
    const streamName = transcodeStreamName.value || ((streamInfo.value?.streamKey || '').split('?')[0]) || `live-${Date.now()}`;
    console.log('[LiveCreate][START] Request params:', JSON.stringify({
      title: basicForm.title,
      streamName,
      portrait: basicForm.mode === 'portrait',
      categoryID,
      subCategoryID
    }));
    
    const result = await fetch(`${getApiBase()}/api/acfun/live/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: basicForm.title,
        coverFile: coverToSend,
        streamName,
        portrait: basicForm.mode === 'portrait',
        categoryID,
        subCategoryID
      })
    }).then(res => res.json());
    
    console.log('[LiveCreate][START] Start result:', JSON.stringify(result, null, 2));
    
    if (result.success && result.data) {
      liveId.value = result.data.liveID || result.data.liveId;
      startLiveStatus.value = { type: 'success', message: '直播创建成功！' };
      try {
        {
          const base = getApiBase();
          const url = new URL('/api/acfun/live/stream-url', base);
          url.searchParams.set('liveId', liveId.value);
          console.log('[LiveCreate][REQ]', 'GET', url.toString());
        }
        const streamResult = await window.electronApi.http.get('/api/acfun/live/stream-url', { liveId: liveId.value });
        console.log('[LiveCreate][RESP] stream-url after start:', JSON.stringify(streamResult, null, 2));
        if (streamResult.success && streamResult.data?.rtmpUrl) {
          const split = splitRtmpUrlAndKey(streamResult.data.rtmpUrl);
          console.log('[LiveCreate][PARSE] split after start:', split);
          console.log('[LiveCreate] Before update - streamInfo:', streamInfo.value);
          streamInfo.value = {
            rtmpUrl: split.server || streamInfo.value?.rtmpUrl || 'rtmp://live.acfun.cn/live',
            streamKey: split.key || streamResult.data.streamKey,
            expiresAt: Date.now() + 3600000
          };
          console.log('[LiveCreate] After update - streamInfo:', streamInfo.value);
        }
      } catch (error) {
        console.error('[LiveCreate][START] Error getting stream URL after start:', error);
      }
      
      // 停止状态检测
      if (streamCheckTimer.value) {
        clearInterval(streamCheckTimer.value);
        streamCheckTimer.value = null;
      }
      if (liveId.value) {
        router.replace(`/live/manage/${liveId.value}`);
      }
    } else {
      throw new Error(result.error || '创建直播失败');
    }
    
  } catch (error) {
    console.error('开始直播失败:', error);
    startLiveStatus.value = {
      type: 'error',
      message: error instanceof Error ? error.message : '创建直播失败，请检查网络连接或稍后重试'
    };
  } finally {
    startLiveLoading.value = false;
  }
}

// 已移除旧的裁剪逻辑

// 进入直播间管理
function goToLiveRoom() {
  if (liveId.value) {
    router.push(`/live/manage/${liveId.value}`);
  }
}

// 辅助函数
function getCoverUrl(cover: string) {
  return cover;
}

function formatRtmpServer(addr: string) {
  if (!addr) return '';
  let url = addr.trim();
  if (!/^rtmps?:\/\//i.test(url)) {
    url = `rtmp://${url}`;
  }
  // Remove trailing slash
  url = url.replace(/\/$/, '');
  // Ensure path exists; if only host, append default app path
  const hasPath = /rtmps?:\/\/[^\s/]+\/.+/.test(url);
  if (!hasPath) {
    url = `${url}/live`;
  }
  return url;
}

function splitRtmpUrlAndKey(full: string): { server: string; key: string } {
  if (!full) return { server: '', key: '' };
  let url = full.trim();
  console.log('[LiveCreate][splitRtmpUrlAndKey] input:', url);
  
  // normalize scheme
  if (!/^rtmps?:\/\//i.test(url)) url = `rtmp://${url}`;
  console.log('[LiveCreate][splitRtmpUrlAndKey] after normalize:', url);
  
  // separate query
  const [path, query] = url.split('?');
  console.log('[LiveCreate][splitRtmpUrlAndKey] path:', path, 'query:', query);
  
  // remove scheme
  const noScheme = path.replace(/^rtmps?:\/\//i, '');
  console.log('[LiveCreate][splitRtmpUrlAndKey] noScheme:', noScheme);
  
  // split by '/'
  const parts = noScheme.split('/');
  console.log('[LiveCreate][splitRtmpUrlAndKey] parts:', parts);
  
  if (parts.length <= 1) return { server: url, key: '' };
  
  // server: scheme + host + app path (excluding last segment)
  const server = `${path.match(/^rtmps?:\/\//i)?.[0] || 'rtmp://'}${parts.slice(0, -1).join('/')}`;
  const last = parts[parts.length - 1];
  const key = query ? `${last}?${query}` : last;
  
  console.log('[LiveCreate][splitRtmpUrlAndKey] result:', { server, key });
  return { server, key };
}

function getModeText(mode: string) {
  switch (mode) {
    case 'portrait': return '竖屏直播';
    case 'landscape': return '横屏直播';
    default: return '未知模式';
  }
}

// 清理定时器
onUnmounted(() => {
  try {
    if (streamCheckTimer.value) {
      clearInterval(streamCheckTimer.value);
      streamCheckTimer.value = null;
    }
  } catch {}
});
// 事件处理：分类改变
function onCategoryChange(value: any, context: any) {
  console.log('[LiveCreateDraft] cascader change:', { value, context, current: basicForm.category });
}

// 刷新推流信息
async function refreshStreamInfo() {
  try {
    const streamStore = useStreamStore();
    await (streamStore as any).refresh(true);
    streamInfo.value = { rtmpUrl: (streamStore as any).rtmpUrl, streamKey: (streamStore as any).streamKey, expiresAt: Number((streamStore as any).expiresAt || Date.now() + 3600000) } as any;
  } catch {}
}
</script>

<style scoped>
.live-create-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--td-bg-color-container);
}

.permission-check,
.permission-denied {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
  padding: 32px;
}

.permission-denied h3 {
  margin: 0;
  color: var(--td-text-color-primary);
}
.permission-denied p {
  color: var(--td-text-color-secondary);
  text-align: center;
  max-width: 400px;
}

.create-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.page-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--td-border-level-1-color);
  flex-shrink: 0;
}
.page-header h2 {
  margin: 0 0 8px 0;
  color: var(--td-text-color-primary);
}
.page-header .subtitle {
  margin: 0;
  color: var(--td-text-color-secondary);
  font-size: 14px;
}

/* 单页布局 - 固定左右分栏 */
.single-page-layout {
  flex: 1;
  display: flex;
  gap: 16px;
  padding: 16px;
  overflow: hidden;
  min-height: 0;
}

.left-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.right-panel {
  width: 400px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.basic-info-card {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.basic-info-card :deep(.t-card__body) {
  padding: 12px;
}

.bottom-actions {
  display: flex;
  justify-content: center;
  padding: 16px 24px;
  border-top: 1px solid var(--td-border-level-1-color);
  flex-shrink: 0;
  background-color: var(--td-bg-color-container);
}

.start-live-btn {
  min-width: 200px;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  line-height: 1;
}

.start-live-btn :deep(.t-icon) {
  margin-right: 6px;
}

.start-live-btn :deep(.t-loading) {
  margin-right: 6px;
}

.custom-file-list {
  display: flex;
}
.custom-file-item {
  position: relative;
}
.custom-file-item img {
  width: 140px;
  height: 80px;
  border-radius: 4px;
  object-fit: cover;
}
.custom-file-item .item-actions {
  position: absolute;
  right: 4px;
  top: 4px;
  display: flex;
  gap: 4px;
}

.cover-upload-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.basic-info-card :deep(.t-form-item) {
  margin-bottom: 8px;
}

.basic-info-card :deep(.t-form-item__label) {
  padding-bottom: 4px;
  font-size: 12px;
}

/* 旧自定义上传触发样式已移除，采用 TDesign 默认卡片布局 */

.cover-preview .preview-container img {
  max-width: 140px;
  max-height: 80px;
  border-radius: 4px;
  object-fit: cover;
}
.cover-preview .preview-actions {
  position: absolute;
  top: 4px;
  right: 4px;
  display: flex;
  gap: 4px;
}

.stream-card,
 .status-card,
 .preview-card {
   margin-bottom: 0;
   min-width: 0;
 }

.stream-card :deep(.t-card__body),
.status-card :deep(.t-card__body),
.preview-card :deep(.t-card__body) {
  padding: 12px;
}

.stream-loading,
.stream-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px;
}

.stream-fields {
  margin-top: 6px;
}

.stream-fields :deep(.t-form-item) {
  margin-bottom: 6px;
}

.stream-fields :deep(.t-form-item__label) {
  padding-bottom: 2px;
  font-size: 11px;
}

.obs-guide {
   margin-top: 8px;
   padding: 6px;
   background-color: var(--td-bg-color-secondarycontainer);
   border-radius: 4px;
   max-height: 160px;
   overflow-y: auto;
 }
.obs-guide h4 {
  margin: 0 0 4px 0;
  color: var(--td-text-color-primary);
  font-size: 14px;
}
.obs-guide p {
  margin: 0;
  color: var(--td-text-color-secondary);
  font-size: 11px;
  line-height: 1.4;
}
.obs-guide li {
  margin: 1px 0;
}

.status-monitor .status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}
.status-monitor .status-indicator .status-text h4 {
  margin: 0 0 2px 0;
  color: var(--td-text-color-primary);
  font-size: 13px;
}
.status-monitor .status-indicator .status-text p {
  margin: 0;
  color: var(--td-text-color-secondary);
  font-size: 12px;
}

.transcode-info h4 {
  margin: 0 0 8px 0;
  color: var(--td-text-color-primary);
  font-size: 14px;
}

.transcode-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.transcode-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background-color: var(--td-bg-color-secondarycontainer);
  border-radius: 4px;
  font-size: 12px;
}
.transcode-item .quality {
  font-weight: 500;
  color: var(--td-text-color-primary);
}
.transcode-item .resolution {
  color: var(--td-text-color-secondary);
}
.transcode-item .bitrate {
  color: var(--td-text-color-placeholder);
  font-size: 11px;
}

.no-transcode {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px;
  color: var(--td-text-color-secondary);
  font-size: 12px;
}

.preview-info {
  display: flex;
  gap: 8px;
}
.preview-info .preview-cover img {
  width: 50px;
  height: 28px;
  border-radius: 3px;
  object-fit: cover;
}
.preview-info .preview-details {
  flex: 1;
  min-width: 0;
}
.preview-info .preview-details h3 {
  margin: 0 0 3px 0;
  color: var(--td-text-color-primary);
  font-size: 12px;
  word-break: break-all;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.preview-info .preview-details p {
  margin: 1px 0;
  color: var(--td-text-color-secondary);
  font-size: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.start-status {
  margin-top: 8px;
}

.crop-container {
  text-align: center;
  padding: 16px;
}
.crop-container img {
  max-width: 100%;
  max-height: 400px;
  border-radius: 8px;
}

.crop-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 12px;
  background-color: var(--td-bg-color-secondarycontainer);
  border-radius: 6px;
  color: var(--td-text-color-secondary);
  font-size: 14px;
}

/* 新增样式 */
.form-section {
  margin-bottom: 16px;
}

.section-title {
  margin: 0 0 8px 0;
  color: var(--td-text-color-primary);
  font-size: 14px;
  font-weight: 500;
}

/* 固定布局，无响应式 */
</style>