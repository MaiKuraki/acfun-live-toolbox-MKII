<template>
  <div class="home-page">
    <div class="home-grid">
      <HomeCardWelcome />
      <HomeCardAccount />
      <HomeCardRole />
      <HomeCardDocs />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useHomeStore } from '../stores/home';
import HomeCardWelcome from '../components/home/HomeCardWelcome.vue';
import HomeCardAccount from '../components/home/HomeCardAccount.vue';
import HomeCardRole from '../components/home/HomeCardRole.vue';
import HomeCardDocs from '../components/home/HomeCardDocs.vue';

const home = useHomeStore();

onMounted(async () => {
  await home.initialize();
});
</script>

<style scoped>
.home-page {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  overflow-y: hidden;
}

.home-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: 12px;
  height: 100%;
}

/* 使网格中的每个卡片在子组件内也保持等高 */
.home-grid :deep(.grid-cell) {
  height: 100%;
}

.home-grid :deep(.grid-cell .t-card) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.home-grid :deep(.grid-cell .t-card .t-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* 响应式设计 - 1024x768优化 */
@media (max-width: 1024px) {
  .home-page {
    padding: 12px;
    gap: 12px;
  }
  .home-grid {
    gap: 8px;
  }
}
</style>
