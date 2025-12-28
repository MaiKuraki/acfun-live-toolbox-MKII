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
        <div class="placeholder-container">
          <div class="placeholder-text">敬请期待</div>
        </div>
      </div>
    </t-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useHomeStore } from '../../stores/home';

const home = useHomeStore();

const roleTitle = computed(() => '直播日历');
</script>

<style scoped>
.role-body { padding: 8px 0 12px 0; }
.placeholder-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 120px;
}
.placeholder-text {
  color: var(--td-text-color-secondary);
  font-size: 16px;
  font-weight: 500;
}
</style>
// 移除依赖未定义类型的字段引用，避免编译错误
