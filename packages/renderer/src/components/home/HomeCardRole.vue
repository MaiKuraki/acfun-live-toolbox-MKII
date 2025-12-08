<template>
  <div class="grid-cell">
    <t-card hover-shadow :title="roleTitle">
      <div v-if="home.loading.C">
        <t-skeleton :row-col="[[{ width: '100%' }],[{ width: '100%' }]]" />
      </div>
      <div v-else-if="home.error.C">
        <t-alert theme="error" :message="home.error.C" closeBtn @close="home.retryCard('C')"></t-alert>
        <div class="empty-state">
          暂无内容
          <t-button size="small" variant="outline" @click="home.retryCard('C')">重试</t-button>
        </div>
      </div>
      <div v-else class="role-body">
        <div class="stats-block">
          <div class="overview-grid">
            <div class="overview-item">
              <div class="overview-icon">
                <t-icon name="video" />
              </div>
              <div class="overview-content">
                <div class="label">直播次数</div>
                <div class="value">{{ 0 }}</div>
              </div>
            </div>
            <div class="overview-item">
              <div class="overview-icon">
                <t-icon name="time" />
              </div>
              <div class="overview-content">
                <div class="label">总时长</div>
                <div class="value">{{ formatDuration(0) }}</div>
              </div>
            </div>
            <div class="overview-item">
              <div class="overview-icon">
                <t-icon name="thumb-up" />
              </div>
              <div class="overview-content">
                <div class="label">点赞数</div>
                <div class="value">{{ formatNumber(0) }}</div>
              </div>
            </div>
            <div class="overview-item">
              <div class="overview-icon">
                <t-icon name="heart" />
              </div>
              <div class="overview-content">
                <div class="label">香蕉数</div>
                <div class="value">{{ formatNumber(0) }}</div>
              </div>
            </div>
            <div class="overview-item">
              <div class="overview-icon">
                <t-icon name="gift" />
              </div>
              <div class="overview-content">
                <div class="label">礼物数</div>
                <div class="value">{{ formatNumber(0) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <t-space align="center" direction="horizontal">
          <t-radio-group variant="default-filled" size="small" :value="role.statsScope" @change="onScopeChange">
            <t-radio-button value="7d">7天</t-radio-button>
            <t-radio-button value="30d">30天</t-radio-button>
          </t-radio-group>
        </t-space>
      </template>
    </t-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useHomeStore } from '../../stores/home';
import { useRoleStore } from '../../stores/role';

const home = useHomeStore();
const role = useRoleStore();

const roleTitle = computed(() => '主播统计');

const onScopeChange = (v: string | number) => {
  const val = typeof v === 'string' ? v : String(v);
  role.setStatsScope(val === '30d' ? '30d' : '7d');
  home.fetchAnchorStats();
};


const formatDuration = (seconds?: number) => {
  if (!seconds) return '0分钟';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`;
  }
  return `${minutes}分钟`;
};

const formatNumber = (num?: number) => {
  if (!num) return '0';
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  return num.toString();
};

// 移除“查看更多”入口，统一为主播视图
</script>

<style scoped>
.role-body { padding: 8px 0 12px 0; }
.stats-row { display: flex; justify-content: space-between; padding: 4px 0; }
.rooms-block .room-card { padding: 8px 12px; border: 1px solid var(--td-border-level-1-color); border-radius: 6px; margin-bottom: 8px; }
.room-title { font-weight: 600; color: var(--td-text-color-primary); }
.room-status { font-size: 12px; color: var(--td-text-color-secondary); }
.empty-state { color: var(--td-text-color-secondary); }

/* 主播统计卡片样式 */
.overview-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.overview-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: var(--td-bg-color-container);
  border-radius: 8px;
  border: 1px solid var(--td-border-level-1-color);
  transition: all 0.2s ease;
}

.overview-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
}

.overview-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--td-brand-color-light);
  color: var(--td-brand-color);
  margin-right: 12px;
  font-size: 16px;
}

.overview-content {
  flex: 1;
}

.overview-content .label {
  font-size: 12px;
  color: var(--td-text-color-secondary);
  margin-bottom: 2px;
}

.overview-content .value {
  font-size: 16px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}
</style>
// 移除依赖未定义类型的字段引用，避免编译错误
