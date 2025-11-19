import { describe, it, expect } from 'vitest'

const base = 'http://127.0.0.1:18299'

describe('只读仓库 SSE 订阅', () => {
  it('建立连接并校验响应头', async () => {
    const controller = new AbortController()
    const res = await fetch(`${base}/sse/renderer/readonly-store`, { signal: controller.signal })
    expect([200]).toContain(res.status)
    const ct = res.headers.get('content-type') || ''
    expect(ct.includes('text/event-stream')).toBe(true)
    controller.abort()
  })
})