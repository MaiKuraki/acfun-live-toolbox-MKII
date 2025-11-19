<template>
  <div class="api-docs">
    <div class="header">
      <h1>开发文档</h1>
      <button class="doc-button" @click="openExternalDocs">接口开发文档</button>
    </div>

    <div class="anchors">
      <a href="#overview">概览</a>
      <a href="#architecture">架构</a>
      <a href="#interfaces">接口</a>
      <a href="#events">事件</a>
      <a href="#messaging">消息传输</a>
      <a href="#samples">样例</a>
    </div>

    <div class="content">
      <section id="overview" class="card">
        <h2>概览</h2>
        <div class="grid-two">
          <div>
            <ul class="mini-list">
              <li>主进程托管 HTTP 与 SSE，渲染侧承载 UI 与 Overlay。</li>
              <li>接口文档外链：点击右上角按钮打开。</li>
              <li>真实请求与真实函数，不使用 mock。</li>
            </ul>
          </div>
          <div class="kv">
            <div class="kv-row"><span class="kv-key">只读仓库</span><span class="kv-val" title="/sse/renderer/readonly-store">/sse/renderer/readonly-store</span></div>
            <div class="kv-row"><span class="kv-key">包装页</span><span class="kv-val" title="/overlay-wrapper">/overlay-wrapper</span></div>
            <div class="kv-row"><span class="kv-key">静态托管</span><span class="kv-val" title="/plugins/:id/(ui|window|overlay)[/*]">/plugins/:id/(ui|window|overlay)[/*]</span></div>
          </div>
        </div>
      </section>
      <section id="architecture" class="card">
        <h2>架构</h2>
        <div class="grid-four">
          <div class="subcard">
            <h3>overlay</h3>
            <ul class="mini-list">
              <li>单实例与静态托管入口。</li>
              <li>SSE 事件：update/message/closed/action。</li>
              <li>参考：<span class="path-text" title="packages/main/src/server/ApiServer.ts:751">packages/main/src/server/ApiServer.ts:751</span>。</li>
            </ul>
          </div>
          <div class="subcard">
            <h3>window</h3>
            <ul class="mini-list">
              <li>窗口托管与单实例置顶。</li>
              <li>静态托管：<span class="path-text" title="/plugins/:id/window[/*]">/plugins/:id/window[/*]</span>。</li>
            </ul>
          </div>
          <div class="subcard">
            <h3>ui</h3>
            <ul class="mini-list">
              <li>只读仓库订阅与总线通信。</li>
              <li>参考：<span class="path-text" title="packages/main/src/server/ApiServer.ts:1078">packages/main/src/server/ApiServer.ts:1078</span>。</li>
            </ul>
          </div>
          <div class="subcard">
            <h3>index.js</h3>
            <pre class="code"><code>{{ indexJsExample }}</code></pre>
            <button class="copy" @click="copy(indexJsExample)">复制</button>
          </div>
        </div>
      </section>
      <section id="interfaces" class="card">
        <h2>接口</h2>
        <div class="grid-two">
          <div>
            <table class="table">
              <thead><tr><th>方法</th><th>路径</th><th>用途</th></tr></thead>
              <tbody>
                <tr><td>GET</td><td>/api/events</td><td>事件查询</td></tr>
                <tr><td>GET</td><td>/api/stats/events</td><td>事件统计</td></tr>
                <tr><td>GET/POST</td><td>/api/export</td><td>导出 CSV</td></tr>
                <tr><td>GET</td><td class="path-cell" title="/api/overlay/:overlayId">/api/overlay/:overlayId</td><td>获取 Overlay 数据</td></tr>
                <tr><td>POST</td><td class="path-cell" title="/api/overlay/:overlayId/action">/api/overlay/:overlayId/action</td><td>触发 Overlay 动作</td></tr>
                <tr><td>POST</td><td class="path-cell" title="/api/overlay/:overlayId/send">/api/overlay/:overlayId/send</td><td>发送自定义消息</td></tr>
                <tr><td>POST</td><td class="path-cell" title="/api/overlay/create">/api/overlay/create</td><td>创建 Overlay</td></tr>
                <tr><td>GET</td><td class="path-cell" title="/sse/overlay/:overlayId">/sse/overlay/:overlayId</td><td>订阅 Overlay SSE</td></tr>
                <tr><td>GET</td><td class="path-cell" title="/sse/plugins/:pluginId/overlay">/sse/plugins/:pluginId/overlay</td><td>订阅插件 Overlay SSE</td></tr>
                <tr><td>GET</td><td class="path-cell" title="/sse/renderer/readonly-store">/sse/renderer/readonly-store</td><td>订阅只读仓库</td></tr>
                <tr><td>GET</td><td class="path-cell" title="/overlay-wrapper">/overlay-wrapper</td><td>外部包装页</td></tr>
                <tr><td>GET</td><td class="path-cell" title="/plugins/:id/(ui|window|overlay)[/*]">/plugins/:id/(ui|window|overlay)[/*]</td><td>静态托管</td></tr>
              </tbody>
            </table>
          </div>
          <div class="hint">
            <div>AcFun 代理端点详见右上角外链。</div>
            <ul class="mini-list">
              <li>auth/danmu/user/live/gift/manager/badge/replay/preview/image/eventsource</li>
              <li>入口：packages/main/src/server/AcfunApiProxy.ts:146</li>
            </ul>
          </div>
        </div>
      </section>
      <section id="events" class="card">
        <h2>事件</h2>
        <table class="table">
          <thead><tr><th>事件</th><th>说明</th></tr></thead>
          <tbody>
            <tr><td>overlay update</td><td>overlay-updated 更新广播</td></tr>
            <tr><td>overlay message</td><td>overlay-message 业务消息</td></tr>
            <tr><td>overlay closed</td><td>overlay-closed 关闭广播</td></tr>
            <tr><td>overlay action</td><td>overlay-action 动作广播</td></tr>
            <tr><td>readonly init</td><td>readonly-store-init 初始快照</td></tr>
            <tr><td>readonly update</td><td>readonly-store-update 后续更新</td></tr>
            <tr><td>heartbeat</td><td>SSE 心跳</td></tr>
          </tbody>
        </table>
        <div class="example-row">
          <div class="subcard">
            <h3>SSE 订阅示例</h3>
            <pre class="code"><code>{{ sseExample }}</code></pre>
            <button class="copy" @click="copy(sseExample)">复制</button>
          </div>
        </div>
      </section>
      <section id="messaging" class="card">
        <h2>消息传输</h2>
        <div class="grid-two">
          <div class="subcard">
            <h3>UI/Window → Overlay</h3>
            <pre class="code"><code>{{ curlSendExample }}</code></pre>
            <button class="copy" @click="copy(curlSendExample)">复制</button>
          </div>
          <div class="subcard">
            <h3>Overlay 动作</h3>
            <pre class="code"><code>{{ curlActionExample }}</code></pre>
            <button class="copy" @click="copy(curlActionExample)">复制</button>
          </div>
        </div>
      </section>
      <section id="samples" class="card">
        <h2>样例</h2>
        <div class="grid-two">
          <div class="subcard">
            <h3>sample-overlay-ui</h3>
            <ul class="mini-list">
              <li>入口：buildResources/plugins/sample-overlay-ui/overlay.html</li>
              <li>逻辑：buildResources/plugins/sample-overlay-ui/index.js</li>
              <li>要点：只读仓库订阅、日志区、消息往返</li>
            </ul>
          </div>
          <div class="subcard">
            <h3>sample-overlay-window</h3>
            <ul class="mini-list">
              <li>入口：buildResources/plugins/sample-overlay-window/window.html</li>
              <li>逻辑：buildResources/plugins/sample-overlay-window/index.js</li>
              <li>要点：窗口特性、消息往返</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

function openExternalDocs() {
  const url = 'http://127.0.0.1:18299/docs/api/index.html'
  try {
    if ((window as any).electronApi?.system?.openExternal) {
      (window as any).electronApi.system.openExternal(url)
      return
    }
  } catch {}
  try { window.open(url, '_blank') } catch {}
}

const indexJsExample = ref(`export function init(ctx) {\n  return { ok: true }\n}\n\nexport function cleanup(ctx) {\n  return { ok: true }\n}\n\nexport function handleMessage({ overlayId, event, payload }) {\n  if (event === 'ping') {\n  }\n  return { ok: true }\n}`)

const sseExample = ref(`const es = new EventSource('http://127.0.0.1:18299/sse/renderer/readonly-store')\nes.addEventListener('readonly-store-init', e => {\n  const data = JSON.parse(e.data)\n})\nes.addEventListener('readonly-store-update', e => {\n  const data = JSON.parse(e.data)\n})\nes.addEventListener('heartbeat', e => {})`)

const curlSendExample = ref(`curl -X POST \\\n  http://127.0.0.1:18299/api/overlay/OVERLAY_ID/send \\\n  -H "Content-Type: application/json" \\\n  -d '{"event":"ping","payload":{"t":Date.now()}}'`)

const curlActionExample = ref(`curl -X POST \\\n  http://127.0.0.1:18299/api/overlay/OVERLAY_ID/action \\\n  -H "Content-Type: application/json" \\\n  -d '{"action":"bringToFront"}'`)

function copy(text: string) {
  try { navigator.clipboard?.writeText(text) } catch {}
}

</script>

<style scoped>
.api-docs {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.anchors { display: flex; gap: 12px; margin-bottom: 16px; }
.anchors a { color: #3498db; text-decoration: none; font-weight: 500; }
.anchors a:hover { text-decoration: underline; }

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e1e5e9;
}

.header h1 {
  margin: 0;
  color: #2c3e50;
  font-size: 2.5rem;
}



 

 





.doc-button {
  padding: 8px 14px;
  border: 1px solid #e1e5e9;
  border-radius: 6px;
  background: #fff;
  color: #34495e;
}
.content { flex: 1; display: flex; flex-direction: column; }

.mini-section { margin-bottom: 24px; }
.mini-list { list-style: disc; padding-left: 20px; color: #34495e; }
.mini-list li { margin-bottom: 8px; line-height: 1.5; }

.card { background: #fff; border: 1px solid #e1e5e9; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
.subcard { background: #fafafa; border: 1px solid #e9edf2; border-radius: 8px; padding: 12px; min-width: 0; overflow: hidden; }
.subcard h3 { margin: 0 0 12px 0; color: #2c3e50; font-size: 16px; font-weight: 600; }

.grid-two { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; min-width: 0; }
.grid-two > div { min-width: 0; overflow: hidden; }
.grid-two { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.grid-four { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; min-width: 0; }
.subcard { background: #fafafa; border: 1px solid #e9edf2; border-radius: 8px; padding: 12px; min-width: 0; overflow: hidden; }
.kv { display: grid; grid-template-columns: 1fr; gap: 8px; }
.kv-row { display: flex; justify-content: space-between; font-size: 14px; align-items: flex-start; }
.kv-key { color: #7f8c8d; flex-shrink: 0; margin-right: 8px; }
.kv-val { color: #2c3e50; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }

.path-text { font-family: 'SF Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 13px; color: #2c3e50; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.path-cell { font-family: 'SF Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px; }
.table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.table th, .table td { border: 1px solid #e1e5e9; padding: 8px; text-align: left; overflow: hidden; }
.table th:nth-child(1) { width: 80px; } /* 方法列 */
.table th:nth-child(2) { width: 40%; } /* 路径列 */
.table th:nth-child(3) { width: auto; } /* 用途列 */
.example-row { display: grid; grid-template-columns: 1fr; gap: 12px; }
.code { background: #0f172a; color: #e2e8f0; padding: 12px; border-radius: 6px; overflow: auto; }
.copy { margin-top: 8px; padding: 6px 10px; border: 1px solid #e1e5e9; background: #fff; border-radius: 6px; }

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: #7f8c8d;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e1e5e9;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 1200px) {
  .grid-four { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .grid-two { grid-template-columns: 1fr; }
  .grid-four { grid-template-columns: 1fr; }
  .kv-row { flex-direction: column; align-items: flex-start; gap: 4px; }
  .path-cell { max-width: 100%; }
  .header { flex-direction: column; gap: 16px; align-items: flex-start; }
  .api-docs { padding: 16px; }
}

@media (max-width: 480px) {
  .header h1 { font-size: 2rem; }
  .table { font-size: 12px; }
  .table th, .table td { padding: 6px; }
  .path-cell { font-size: 11px; }
}
</style>