import { defineConfig } from 'vite';
import * as path from 'path';
import vue from '@vitejs/plugin-vue';
import electronRenderer from 'vite-plugin-electron-renderer';
// https://vite.dev/config/
export default defineConfig({
  define: {
    '__dirname': JSON.stringify(__dirname),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
  },
  build: {
    // 启用压缩
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 移除console.log
        drop_debugger: true, // 移除debugger
        pure_funcs: ['console.log'] // 移除特定的函数调用
      }
    },
    // 启用source map（生产环境可关闭）
    sourcemap: false,
    // 限制chunk大小警告
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      external: ['electron', 'path'],
      output: {
        globals: {
          'electron': 'electron',
          'path': 'path'
        },
        manualChunks: {
          // UI库单独打包
          'tdesign': ['tdesign-vue-next', 'tdesign-icons-vue-next'],
          // 图表库单独打包
          'echarts': ['echarts'],
          // 工具库单独打包
          'vue-cropper': ['vue-cropper'],
          'wujie': ['wujie-vue3'],
          // lodash单独打包
          'lodash': ['lodash'],
          // 插件相关功能单独打包
          'plugin-system': [
            './src/stores/plugin.ts',
            './src/utils/plugin-api/createRendererPluginApi.ts',
            './src/utils/plugin-injection.ts'
          ],
          // 大型页面组件单独打包
          'large-pages': [
            './src/pages/Stats.vue',
            './src/pages/LiveManagePage.vue',
            './src/pages/PluginManagementPage.vue'
          ]
        }
      }
    }
  },
  plugins: [vue(), electronRenderer()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
})
