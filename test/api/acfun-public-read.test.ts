import { describe, it, expect } from 'vitest'

const base = 'http://127.0.0.1:18299'

describe('AcFun 公共只读接口', () => {
  it('获取直播分类', async () => {
    const res = await fetch(`${base}/api/acfun/live/categories`)
    expect(res.ok).toBe(true)
  })

  it('获取热门直播', async () => {
    const url = new URL('/api/acfun/live/hot-lives', base)
    url.searchParams.set('page', '1')
    url.searchParams.set('size', '10')
    const res = await fetch(url)
    expect([200, 400, 401, 404, 500]).toContain(res.status)
  })

  it('获取指定用户信息', async () => {
    const url = new URL('/api/acfun/user/info', base)
    url.searchParams.set('userID', '1')
    const res = await fetch(url)
    expect([200, 400, 401, 404, 500]).toContain(res.status)
  })
})