import { app } from 'electron';

export async function installVueDevtools(): Promise<void> {
  try {
    if (app.isPackaged || process.env.NODE_ENV === 'production') return;
    const mod: any = await import('electron-devtools-installer');
    const installExtension = mod?.default?.default ?? mod?.default ?? mod;
    const VUE = mod?.VUEJS_DEVTOOLS ?? mod?.default?.VUEJS_DEVTOOLS;
    await installExtension(VUE)
      .then((name: string) => { try { console.info(`[DevTools] Added Extension: ${name}`); } catch {} })
      .catch((err: any) => { try { console.warn('[DevTools] Vue Devtools install failed:', err); } catch {} });
  } catch {}
}
