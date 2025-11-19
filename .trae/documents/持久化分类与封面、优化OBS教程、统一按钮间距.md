## 问题与目标
- 分类与封面未在离开后自动带入：保证草稿持久化与恢复稳定
- OBS设置教程不显示具体地址/密钥值，统一字体样式
- “等待推流”左侧图标与文字保持一致间隔

## 变更点与文件
- 主要文件：`packages/renderer/src/pages/LiveCreatePage.vue`
  - 草稿持久化与恢复：`266–291`（load/saveDraft）、`365–373`（onMounted）、`44–56`（分类UI）、`533–570/951–1018`（封面处理）
  - OBS教程文案与样式：`149–153`、`1296–1329`
  - 开始直播按钮与样式：`165–178`、`1193–1198`

## 实施方案
### 1. 草稿持久化与恢复稳定化
- 引入 `isRestoringDraft` 标志，在 `onMounted` 初次恢复期间禁止 `saveDraft` 覆盖现有草稿（避免空值回写）
- 调整 `saveDraft()` 为“合并写入”，仅当字段为“有效值”才覆盖：
  - `title` 非空字符串时写入
  - `category` 仅在为 `number[]` 且长度>0时写入
  - `cover` 非空字符串时写入
  - `mode` 保持现有逻辑
- 在封面处理（上传/裁剪/删除）与分类选择变更后，正常触发 `saveDraft`；离开页面不会被空值清空
- 保留既有校验与提交兜底：未选分类时阻止提交；提交时若缺子类且首父有子类，则自动补首父+首子（`845–853`）

### 2. OBS设置教程文案与样式统一
- 移除动态插值 `rtmpUrl/streamKey` 与 `<code>` 标签，使用中性文案：
  - 服务选择“自定义”；填写地址与密钥；开始推流；回到本页等待检测
  - 编码建议、常见提示保留，但不显示具体值
- 样式统一：使用现有 `t-card` 默认字体，必要时在 `.obs-guide` 下统一 `font-size/line-height` 与页面其他段落一致

### 3. 按钮图标与文字间距统一
- 补充样式以覆盖两种场景：
  - 非加载态：`<t-icon>` 与文本之间设置固定 `margin-right: 6px`
  - 加载态（`streamStatus === 'connecting'`）：为按钮内置 loading spinner 设置 `margin-right: 6px`
- 保持按钮 `inline-flex` 与 `align-items: center`，确保垂直居中

## 验证与约束
- 仅执行静态代码走查与类型检查：`pnpm -C packages/renderer typecheck`
- 不启动渲染进程开发服务器，不编写/运行测试用例
- 删除无用回退代码；不引入新依赖；遵循 TDesign/Vue 现有风格

## 交付与记录
- 更新 `tasks.md` 添加本次修复条目
- 将要点写入 memory 以便后续追踪