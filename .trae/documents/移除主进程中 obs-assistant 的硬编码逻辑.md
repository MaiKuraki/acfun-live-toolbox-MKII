## 变更范围
- 主进程：`packages/main/src/index.ts`
- 渲染层：`packages/renderer/src/pages/LiveCreatePage.vue`
- 目标：删掉所有针对 `obs-assistant` 的硬编码逻辑，不保留兼容或回退代码。

## 将删除的主进程硬编码
- 配置快照与 autoStartObs 专属日志：
  - `packages/main/src/index.ts:208-212`
- 自动启用 obs-assistant 逻辑（基于 autoStartObs）：
  - `packages/main/src/index.ts:225-231`
- 保留通用插件流程：加载已安装插件、启用 `enabled=true` 的插件；不对任何插件做特殊处理。

## 将删除的渲染层硬编码
- 页面挂载时读取 `obs-assistant` 配置并尝试自动拉起 OBS：
  - `packages/renderer/src/pages/LiveCreatePage.vue:463-468`
- 监听 `streamInfo` 变化并将推流地址/密钥同步到 OBS：
  - `packages/renderer/src/pages/LiveCreatePage.vue:865-873`
- 删除后 LiveCreate 页面仅负责推流信息展示与创建直播，不再耦合 OBS 行为。

## 不变与保留
- 渲染层其他与直播创建、推流状态轮询、分类与封面处理相关逻辑全部保留。
- 主进程的插件框架、事件广播到 `plugin:${p.id}:overlay` 的通用机制保留。

## 行为变化与影响
- 应用不再在主/渲染层对 `obs-assistant` 做任何特殊处理；是否启用、是否自动化由插件自身与用户操作决定。
- 如插件被禁用，渲染层也不会尝试调用其进程方法。

## 验证步骤（确认后执行）
1. 构建并运行应用，确认主进程日志不再出现 `obs-assistant` 专属日志与自动启用行为。
2. 打开 LiveCreate 页面，确认未尝试启动 OBS，且页面功能正常（权限检查、分类加载、推流信息获取、开始直播）。
3. 搜索代码库确认不再存在上述行号的 `obs-assistant` 相关调用。

## 完成标准
- 指定文件的指定片段完全删除，主进程与渲染层中不再存在任何 `obs-assistant` 专属逻辑。
- 应用启动与直播创建流程正常，无构建/运行错误。