<template>
  <div class="grid-cell">
    <t-card hover-shadow title="公告栏">
      <div v-if="home.loading.A">
        <t-skeleton :row-col="[[{ width: '100%' }],[{ width: '100%' }]]" />
      </div>
      <t-alert v-else-if="home.error.A" theme="error" :message="home.error.A" closeBtn @close="home.retryCard('A')"></t-alert>
      <div v-else class="cell-body">
        <div class="announcement" v-html="announcementText"></div>
      </div>
    </t-card>
  </div>
  
</template>

<script setup lang="ts">
import { useHomeStore } from '../../stores/home';
import { computed } from 'vue';

const home = useHomeStore();

const announcementText = computed(() => `
<b>欢迎使用 ACLiveFrame - 专为 AcFun 打造的开源直播工具框架！</b><br>🎯 核心功能<br>
提供实时弹幕捕获、礼物统计、观众互动管理等专业直播工具，支持多房间并发监听和智能数据分析。<br>
🔌 开放生态<br>
基于模块化插件系统，可开发弹幕弹窗、礼物提醒等自定义功能插件<br>
🚀 快速开始<br>
1. 扫码登录 AcFun 账号<br>
2. 安装所需功能插件<br>
3. 开始直播！
`.replace(/\n/g, ''));
</script>

<style scoped>
.cell-body { flex: 1; }
.announcement {
  margin-bottom: 12px;
  color: var(--td-text-color-primary);
  font-size: 14px;
  line-height: 1.6;
  max-height: 400px;
  overflow-y: auto;
}
.announcement br {
  margin-bottom: 8px;
}
</style>
