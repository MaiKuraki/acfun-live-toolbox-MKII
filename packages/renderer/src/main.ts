import { createApp } from 'vue';
import { createPinia } from 'pinia';
import TDesign from 'tdesign-vue-next';
import 'tdesign-vue-next/es/style/index.css';
import './style.css';
import App from './App.vue';
import router from './router';
import { reportReadonlyUpdate } from './utils/readonlyReporter'
import { useNetworkStore } from './stores/network'
import { Icon as TIcon } from 'tdesign-icons-vue-next';
import GlobalPopup from './services/globalPopup';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(TDesign);
app.component('t-icon', TIcon);
app.mount('#app');

try {
  (async () => {
    try {
      const ns = useNetworkStore()
      await ns.init()
    } catch {}
  })();
  const hash = String(window.location.hash || '');
  window.electronApi.on('renderer-global-popup', (msg: any) => {
    try {
      const { action, payload, requestId } = msg || {};
      try { console.log('[MainRenderer] global-popup', { action, requestId, payload }); } catch {}
      if (action === 'toast') GlobalPopup.toast(String(payload?.message || ''), payload?.options);
      else if (action === 'alert') GlobalPopup.alert(String(payload?.title || ''), String(payload?.message || ''), payload?.options);
      else if (action === 'confirm') {
        (async () => {
          const ok = await GlobalPopup.confirm(String(payload?.title || ''), String(payload?.message || ''), payload?.options);
          try { console.log('[MainRenderer] confirm result', { requestId, ok }); } catch {}
          try { window.electronApi.popup.respondConfirm(String(requestId || ''), !!ok); } catch {}
        })();
      }
    } catch {}
  });

} catch {}

try {
  const to = router.currentRoute.value as any;
  const path = String(to?.fullPath || window.location.hash || '');
  const name = String(to?.name || '');
  const title = String((to?.meta as any)?.title || document.title.replace(/\s*-\s*ACLiveFrame$/, '') || '');
  reportReadonlyUpdate({ ui: { routePath: path, pageName: name, pageTitle: title } });
} catch {}

try {
  router.isReady().then(() => {
    const rt = router.currentRoute.value as any;
    const path = String(rt?.fullPath || window.location.hash || '');
    const name = String(rt?.name || '');
    const title = String((rt?.meta as any)?.title || document.title.replace(/\s*-\s*ACLiveFrame$/, '') || '');
    reportReadonlyUpdate({ ui: { routePath: path, pageName: name, pageTitle: title } });
  });
} catch {}

try {
  window.addEventListener('hashchange', () => {
    try {
      const rt = router.currentRoute.value as any;
      const path = String(rt?.fullPath || window.location.hash || '');
      const name = String(rt?.name || '');
      const title = String((rt?.meta as any)?.title || document.title.replace(/\s*-\s*ACLiveFrame$/, '') || '');
      reportReadonlyUpdate({ ui: { routePath: path, pageName: name, pageTitle: title } });
    } catch {}
  });
} catch {}
