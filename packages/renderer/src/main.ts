import { createApp } from 'vue';
import { createPinia } from 'pinia';
import TDesign from 'tdesign-vue-next';
import 'tdesign-vue-next/es/style/index.css';
import './style.css';
import App from './App.vue';
import router from './router';
import { reportReadonlyUpdate } from './utils/readonlyReporter'
import { Icon as TIcon } from 'tdesign-icons-vue-next';
import GlobalPopup from './services/globalPopup';
import { usePluginStore } from './stores/plugin';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(TDesign);
app.component('t-icon', TIcon);
app.mount('#app');

try {
  window.electronApi?.on('renderer-global-popup', (msg: any) => {
    try {
      const { action, payload, requestId } = msg || {};
      console.log('[MainRenderer] global-popup', { action, requestId, payload });
      switch (action) {
        case 'toast':
          GlobalPopup.toast(`${payload?.message}`, payload?.options);
          break;
        case 'alert':
          GlobalPopup.alert(`${payload?.title}`, `${payload?.message}`, payload?.options);
          break;
        case 'close':
          GlobalPopup.close(`${payload?.id}`);
          break;
        case 'confirm':
          (async () => {
            const ok = await GlobalPopup.confirm(`${payload?.title}`, `${payload?.message}`, payload?.options);
            console.log('[MainRenderer] confirm result', { requestId, ok });
            window.electronApi?.popup.respondConfirm(`${requestId}`, !!ok);
          })();
          break;
      }
    } catch { }
  });
} catch { }

try {
  window.electronApi?.on('renderer-global-play-sound', (msg: any) => {
    try {
      const { src, options } = msg || {};
      console.log('[MainRenderer] play-sound', { src, options });
      if (!src) return;

      const audio = new Audio(src);
      if (options?.volume !== undefined) {
        audio.volume = Math.max(0, Math.min(1, options.volume));
      }
      if (options?.loop) {
        audio.loop = true;
      }

      audio.play().catch((error: any) => {
        console.error('[MainRenderer] Audio play failed:', error);
      });
    } catch (error: any) {
      console.error('[MainRenderer] Audio setup failed:', error);
    }
  });
} catch { }


const reportRouteInfo = () => {
  const rt = router.currentRoute.value as any;
  const path = String(rt?.fullPath || window.location.hash || '');
  const name = String(rt?.name || '');
  const title = String((rt?.meta as any)?.title || document.title.replace(/\s*-\s*ACLiveFrame$/, '') || '');
  reportReadonlyUpdate({ ui: { routePath: path, pageName: name, pageTitle: title } });
};


router.isReady().then(async () => {
  reportRouteInfo();
  // await useNetworkStore().init()
  await usePluginStore().loadPlugins();
});
window.addEventListener('hashchange', reportRouteInfo);