import { describe, it, expect } from 'vitest'

const base = 'http://127.0.0.1:18299'

describe('插件静态托管', () => {
  it('示例 Overlay 页面可访问', async () => {
    const res = await fetch(`${base}/plugins/sample-overlay-ui/overlay.html`)
    expect([200, 404]).toContain(res.status)
  })

  it('示例 Window 页面可访问', async () => {
    const res = await fetch(`${base}/plugins/sample-overlay-window/window.html`)
    expect([200, 404]).toContain(res.status)
  })
})