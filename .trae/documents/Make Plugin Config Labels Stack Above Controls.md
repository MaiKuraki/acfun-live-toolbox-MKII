**Issue**

- Long config titles in the plugin configuration dialog squeeze controls horizontally.

**Plan**

- Update the plugin configuration dialog form in `packages/renderer/src/pages/PluginManagementPage.vue` to ensure labels and controls are not on the same line.

Changes:

1) Form props
- Set `layout="vertical"` (already present) and add `label-width="0"` so no horizontal label width is reserved.
- Optionally set `labelAlign="top"` if supported to force label above control.

2) CSS
- Add styles so labels are block-level and wrap:
  - `.plugin-config .t-form__label { display: block; width: 100%; white-space: normal; }`
  - Ensure `.t-form__item` stacks label and control vertically consistently.

3) Keep help text below control (existing `#help` slot).

**Outcome**

- Labels will render above controls, wrapping long titles without squeezing input components.
- Minimal code change, consistent with TDesign usage.

**Verification**

- Open a plugin with long `label` fields in `manifest.config`.
- Confirm labels are above inputs; long titles wrap; controls have full width.
