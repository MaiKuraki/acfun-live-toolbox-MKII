import { defineStore } from 'pinia';
import { ref } from 'vue';

type CardKey = 'A' | 'B' | 'C' | 'D';

interface DocItem {
  title: string;
  desc: string;
  link: string;
}

export const useHomeStore = defineStore('home', () => {
  const loading = ref<Record<CardKey, boolean>>({ A: false, B: false, C: false, D: false });
  const error = ref<Record<CardKey, string | null>>({ A: null, B: null, C: null, D: null });

  const userInfo = ref<any>(null);
  const docs = ref<DocItem[]>([]);
  const anchorStats = ref<{ lastSessionAt?: string; followers?: number; giftIncome?: number } | null>(null);

  async function fetchUserInfo() {
    loading.value.B = true; error.value.B = null;
    try {
      if (window.electronApi?.account?.getUserInfo) {
        const u = await window.electronApi.account.getUserInfo();
        userInfo.value = u;
      } else {
        throw new Error('IPC account.getUserInfo not available');
      }
    } catch (e: any) {
      error.value.B = e?.message || '获取用户信息失败';
    } finally {
      loading.value.B = false;
    }
  }

  async function fetchDocs() {
    loading.value.D = true; error.value.D = null;
    try {
      // Static docs list as initial implementation; future: HTTP/IPC bridge
      docs.value = [
        { title: '快速上手', desc: '了解如何使用工具箱进行直播辅助', link: '/system/develop' },
        { title: 'API 文档', desc: '插件与系统接口说明', link: '/system/develop' },
        { title: '常见问题', desc: '排查与解决常见问题的指南', link: '/system/develop' },
      ];
    } catch (e: any) {
      error.value.D = e?.message || '获取文档列表失败';
    } finally {
      loading.value.D = false;
    }
  }

  async function fetchAnchorStats() {
    loading.value.C = true; error.value.C = null;
    try {
      anchorStats.value = {
        lastSessionAt: new Date(Date.now() - 86400000).toISOString(),
        followers: 12840,
        giftIncome: 3240,
      };
    } catch (e: any) {
      error.value.C = e?.message || '获取主播数据失败';
    } finally {
      loading.value.C = false;
    }
  }

  async function initialize() {
    loading.value.A = true; error.value.A = null;
    try {
      await fetchUserInfo();
      await Promise.all([fetchAnchorStats(), fetchDocs()]);
    } catch (e: any) {
      error.value.A = e?.message || '主页初始化失败';
    } finally {
      loading.value.A = false;
    }
  }

  function retryCard(card: CardKey) {
    if (card === 'B') return fetchUserInfo();
    if (card === 'C') return fetchAnchorStats();
    if (card === 'D') return fetchDocs();
    return initialize();
  }

  return {
    loading,
    error,
    userInfo,
    docs,
    anchorStats,
    initialize,
    retryCard,
    fetchAnchorStats,
  };
});
