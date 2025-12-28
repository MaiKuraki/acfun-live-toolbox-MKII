import { defineStore } from 'pinia'
import router from '../router';


export const useNetworkStore = defineStore('network', {
  state: () => ({
    apiPort: undefined as number | undefined,
    running: false,
    error: undefined as string | undefined,
  }),
  getters: {
    apiBase(state): string {
      if(!state.apiPort){
        //@ts-ignore
        this.init()
      }
      const p = Number(state.apiPort)
      if (!Number.isFinite(p) || p <= 0 || p > 65535) throw new Error('API_PORT_NOT_CONFIGURED')
      return `http://127.0.0.1:${p}`
    },
  },
  actions: {
    async init() {
      if ((window as any).electronApi) {
        await this.refreshStatus()
      } else {
        this.apiPort = Number(router.currentRoute.value.query.apiPort)
      }
    },
    async refreshStatus() {
      try {
        const res = await (window as any).electronApi?.system.serverStatus()
        const { running, error, port } = (res && res.success) ? (res as any).data || {} : {}
        this.running = !!running
        this.error = error || undefined
        this.apiPort = Number(port)
      } catch { console.error('refresh network status error') }
    },
  }
})
