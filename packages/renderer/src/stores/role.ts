import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { reportReadonlyUpdate, reportReadonlyInit } from '../utils/readonlyReporter';

export type AppRole = 'anchor';
export type StatsScope = '7d' | '30d';

export const useRoleStore = defineStore('role', () => {
  const current = ref<AppRole>('anchor');
  const statsScope = ref<StatsScope>('7d');

  function initStatsScope() {
    const savedScope = localStorage.getItem('role.statsScope');
    if (savedScope === '7d' || savedScope === '30d') {
      statsScope.value = savedScope as StatsScope;
    }
  }

  // 固定主播角色，不再支持角色切换

  function setStatsScope(scope: StatsScope) {
    statsScope.value = scope;
    localStorage.setItem('role.statsScope', scope);
  }

  // Boot
  initStatsScope();
  try { localStorage.removeItem('role.current'); } catch {}
  try {
    reportReadonlyInit({
      role: {
        current: current.value,
        statsScope: statsScope.value,
      }
    });
  } catch {}

  // 变更订阅：统计范围变化时，调用只读上报
  watch(
    () => statsScope.value,
    () => {
      try {
        reportReadonlyUpdate({
          role: {
            current: current.value,
            statsScope: statsScope.value,
          }
        });
      } catch {}
    }
  );

  return {
    current,
    statsScope,
    setStatsScope,
  };
});
