<template>
  <div class="cover-cropper">
    <div class="uploader" :class="{ hasImage: !!modelValue }" @click="openFileDialog">
      <input ref="fileInputRef" type="file" accept="image/jpeg,.jpg,.jpeg" class="hidden-file-input" @change="onFileSelected" />
      <div v-if="!modelValue" class="empty-state">
        <div class="plus">+</div>
        <div class="text">上传图片</div>
      </div>
      <div v-else class="preview">
        <img :src="modelValue" alt="封面预览" />
        <div class="overlay"><span>修改图片</span></div>
      </div>
    </div>
    <t-dialog v-model:visible="showCropDialog" header="裁剪封面" :width="820" :confirm-btn="{ content: '确定保存' }" :cancel-btn="{ content: '取消' }" @confirm="confirmCrop" @close="cancelCrop">
      <div class="cropper-wrap">
        <VueCropper ref="cropperRef" :img="cropSrc" :outputSize="0.85" outputType="jpeg" :autoCrop="true" :fixed="true" :fixedNumber="[16, 9]" :centerBox="true" :canScale="true" mode="cover" />
      </div>
    </t-dialog>
  </div>
  </template>

<script setup lang="ts">
import { ref } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import { VueCropper } from 'vue-cropper'
import 'vue-cropper/dist/index.css'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void; (e: 'change', v: string): void }>()

const showCropDialog = ref(false)
const cropSrc = ref('')
const cropperRef = ref<any>()
const fileInputRef = ref<HTMLInputElement>()

function openFileDialog() {
  fileInputRef.value?.click()
}

function onFileSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const f = input.files && input.files[0]
  if (f) {
    const nameOk = /\.jpe?g$/i.test(f.name || '')
    const typeOk = String(f.type || '').toLowerCase() === 'image/jpeg'
    if (!nameOk && !typeOk) {
      MessagePlugin.error('仅支持 JPG 格式图片')
      input.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      cropSrc.value = String(reader.result || '')
      showCropDialog.value = true
      input.value = ''
    }
    reader.readAsDataURL(f)
  }
}

function cancelCrop() {
  showCropDialog.value = false
  cropSrc.value = ''
}

async function confirmCrop() {
  try {
    const cropper = cropperRef.value
    if (!cropper) throw new Error('裁剪未准备就绪')
    cropper.getCropData(async (base64: string) => {
      if (!base64) {
        await MessagePlugin.error('裁剪失败，请重试')
        return
      }
      emit('update:modelValue', base64)
      emit('change', base64)
      showCropDialog.value = false
      await MessagePlugin.success('封面裁剪并压缩完成')
    })
  } catch (e: any) {
    await MessagePlugin.error(e?.message || '裁剪失败，请重试')
  }
}
</script>

<style scoped>
.uploader { width: 240px; height: 136px; border-radius: 8px; background-color: var(--td-bg-color-secondarycontainer); border: 1px solid var(--td-border-level-1-color); display: flex; align-items: center; justify-content: center; position: relative; cursor: pointer; overflow: hidden; }
.hidden-file-input { display: none; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; color: var(--td-text-color-secondary); }
.empty-state .plus { font-size: 24px; line-height: 1; color: var(--td-text-color-primary); }
.empty-state .text { font-size: 12px; }
.preview { width: 100%; height: 100%; position: relative; }
.preview img { width: 100%; height: 100%; object-fit: cover; border-radius: inherit; }
.overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.45); color: #fff; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity .2s ease; font-size: 14px; }
.uploader.hasImage:hover .overlay { opacity: 1; }
.cropper-wrap { width: 720px; height: 405px; margin: 0 auto; }
</style>
