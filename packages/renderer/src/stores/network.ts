import { defineStore } from 'pinia'

export const useNetworkStore = defineStore('network', {
  state: () => ({
    apiPort: undefined as number | undefined,
    running: false,
    error: undefined as string | undefined,
  }),
  getters: {
    apiBase(state): string {
      const p = Number(state.apiPort)
      if (!Number.isFinite(p) || p <= 0 || p > 65535) throw new Error('API_PORT_NOT_CONFIGURED')
      return `http://127.0.0.1:${p}`
    },
  },
  actions: {
    async init() {
      await this.refreshPort()
      await this.refreshStatus()
    },
    async refreshPort() {
      const cfg = await (window as any).electronApi.system.getConfig()
      const p = Number(cfg && cfg['server.port'])
      if (Number.isFinite(p) && p > 0 && p <= 65535) this.apiPort = p
    },
    async refreshStatus() {
      try {
        const res = await (window as any).electronApi.system.serverStatus()
        const data = (res && res.success) ? (res as any).data || {} : {}
        this.running = !!data.running
        this.error = data.error || undefined
        const p = Number(data.port)
        if (Number.isFinite(p) && p > 0 && p <= 65535) this.apiPort = p
      } catch {}
    },
    setPort(p: number) {
      this.apiPort = Number(p)
    },
  }
})

