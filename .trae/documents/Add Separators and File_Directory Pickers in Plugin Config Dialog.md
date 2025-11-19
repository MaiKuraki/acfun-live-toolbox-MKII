**Goal**

- Add visual separators between config items
- Support file/directory selection controls in plugin config dialog without changing plugin manifests elsewhere

**Implementation**

- In `packages/renderer/src/pages/PluginManagementPage.vue`:

  1) Separator:
  - Insert `<t-divider />` after each `<component .../>` inside the `v-for` form items, so each config entry is visually separated.

  2) File/Directory pickers:
  - Treat `config.type === 'file'` or `'directory'` as text input for display, and render a small button next to/below the input to open system dialogs.
  - Add a method `pickPath(fieldKey: string, type: 'file' | 'directory')` that calls `window.electronApi.dialog.showOpenDialog` with proper `properties` (openFile/openDirectory) and writes the selected path into `pluginConfig[fieldKey]`.
  - Update template to conditionally render the “选择文件/选择目录” button when the config type is file/directory.

- Keep labels stacked above controls (using `label-align="top"`) and the existing CSS for label wrapping.

**Verification**

- Open a plugin config dialog:
  - Each item shows a divider underneath.
  - For items with `type: 'file'` or `type: 'directory'`, a button appears to select path, and the selected path populates the field.
