import { createApp } from 'vue';
import { createPinia } from 'pinia';
import TDesign from 'tdesign-vue-next';
import 'tdesign-vue-next/es/style/index.css';
import './style.css';
import App from './App.vue';
import router from './router';
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
  const hash = String(window.location.hash || '');
  if (!hash.includes('/plugins/') || !hash.includes('/window')) {
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
  }
} catch {}
