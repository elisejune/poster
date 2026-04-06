<template>
  <div class="toolbar">
    <button class="toolbar-btn" @click="triggerUpload">📂 上传Excel</button>
    <input
      ref="fileInput"
      type="file"
      accept=".xlsx,.xls"
      style="display: none"
      @change="onFileChange"
    />
    <span class="toolbar-filename">{{ fileName }}</span>
    <button class="toolbar-btn" @click="$emit('refresh')">🔄 刷新数据</button>
    <label class="toolbar-label">📅 日期：</label>
    <input
      type="date"
      class="toolbar-date"
      :value="dateValue"
      @input="$emit('update:dateValue', ($event.target as HTMLInputElement).value)"
    />
    <button class="toolbar-btn" @click="$emit('screenshot')">📸 保存截图</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  fileName: string
  dateValue: string
}>()

const emit = defineEmits<{
  'update:dateValue': [value: string]
  'upload': [file: File]
  'screenshot': []
  'refresh': []
}>()

const fileInput = ref<HTMLInputElement | null>(null)

function triggerUpload() {
  if (fileInput.value) {
    fileInput.value.value = ''
    fileInput.value.click()
  }
}

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    emit('upload', file)
  }
}
</script>
