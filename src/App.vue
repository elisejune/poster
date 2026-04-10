<template>
  <AppToolbar
    :file-name="fileName"
    :date-value="dateValue"
    :status-text="statusText"
    @update:date-value="dateValue = $event"
    @upload="onUpload"
    @screenshot="onScreenshot"
    @refresh="onRefresh"
  />

  <div class="toast" :class="toast.type" v-if="toast.visible">{{ toast.message }}</div>

  <div ref="posterRef" class="poster">
    <PosterHeader :display-date="displayDate" />

    <ReportTable
      section-class="commend-section"
      :columns="['姓名', '所属处室', '事件类型', '表扬事件', '同类事件累计次数']"
      :rows="commendRows"
      :empty-message="'本周无表扬事件'"
    />

    <ReportTable
      section-class="notice-section"
      :columns="['姓名', '所属处室', '事件类型', '违规事件', '通报依据', '同类事件累计次数']"
      :rows="noticeRows"
      :empty-message="'本周无违规事件，继续保持～'"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import AppToolbar from './components/AppToolbar.vue'
import PosterHeader from './components/PosterHeader.vue'
import ReportTable from './components/ReportTable.vue'
import { useExcel } from './composables/useExcel'
import { useScreenshot } from './composables/useScreenshot'
import { formatDateISO, formatDateDot, isInPreviousWeek } from './utils/dateUtils'

const posterRef = ref<HTMLElement | null>(null)
const dateValue = ref(formatDateISO(new Date()))

const displayDate = computed(() => {
  const parts = dateValue.value.split('-')
  return `${parts[0]}.${parts[1]}.${parts[2]}`
})

const { fileName, commendData, noticeData, loadFile, refresh } = useExcel()
const { takeScreenshot } = useScreenshot()

const statusText = computed(() => {
  if (commendRows.value.length === 0 && noticeRows.value.length === 0) return ''
  return `本期表扬 ${commendRows.value.length} 条，批评 ${noticeRows.value.length} 条`
})

const toast = reactive({ visible: false, message: '', type: 'success' as 'success' | 'error' | 'info' })
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
  if (toastTimer) clearTimeout(toastTimer)
  toast.message = message
  toast.type = type
  toast.visible = true
  toastTimer = setTimeout(() => { toast.visible = false }, 2500)
}

async function onUpload(file: File) {
  try {
    await loadFile(file)
    showToast(`✅ 文件加载成功`)
  } catch {
    showToast('❌ 文件读取失败，请检查文件格式', 'error')
  }
}

async function onRefresh() {
  try {
    await refresh()
    showToast('✅ 数据已刷新')
  } catch {
    showToast('⚠️ 请先上传 Excel 文件', 'error')
  }
}

const commendRows = computed(() => {
  const endDate = new Date(dateValue.value)
  console.log('[表扬] 当前设置日期:', dateValue.value)
  const filtered = commendData.value.filter(r => isInPreviousWeek(r.date, endDate))
  filtered.forEach(r => console.log(`[表扬] ${r.name} - 事件时间: ${r.date}`))
  return filtered.map(r => [
    r.name,
    r.department,
    r.eventType,
    r.event,
    r.cumulative + '次',
  ])
})

const noticeRows = computed(() => {
  const endDate = new Date(dateValue.value)
  console.log('[批评] 当前设置日期:', dateValue.value)
  const filtered = noticeData.value.filter(r => isInPreviousWeek(r.date, endDate))
  filtered.forEach(r => console.log(`[批评] ${r.name} - 事件时间: ${r.date}`))
  return filtered.map(r => [
    r.name,
    r.department,
    r.eventType,
    r.event,
    r.basis,
    r.cumulative + '次',
  ])
})

function onScreenshot() {
  if (posterRef.value) {
    showToast('📸 正在生成截图...', 'info')
    takeScreenshot(posterRef.value).then(() => {
      showToast('✅ 截图已保存')
    }).catch(() => {
      showToast('❌ 截图生成失败', 'error')
    })
  } else {
    showToast('⚠️ 无法获取海报内容', 'error')
  }
}
</script>
