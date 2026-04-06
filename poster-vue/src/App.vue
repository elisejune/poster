<template>
  <AppToolbar
    :file-name="fileName"
    :date-value="dateValue"
    @update:date-value="dateValue = $event"
    @upload="loadFile"
    @screenshot="onScreenshot"
  />

  <div ref="posterRef" class="poster">
    <PosterHeader :display-date="displayDate" />

    <ReportTable
      section-class="commend-section"
      :columns="['姓名', '所属处室', '事件类型', '表扬事件', '累计']"
      :rows="commendRows"
    />

    <ReportTable
      section-class="notice-section"
      :columns="['姓名', '所属处室', '事件类型', '违规事件', '通报依据', '累计']"
      :rows="noticeRows"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import AppToolbar from './components/AppToolbar.vue'
import PosterHeader from './components/PosterHeader.vue'
import ReportTable from './components/ReportTable.vue'
import { useExcel } from './composables/useExcel'
import { useScreenshot } from './composables/useScreenshot'
import { formatDateISO, formatDateDot } from './utils/dateUtils'

const posterRef = ref<HTMLElement | null>(null)
const dateValue = ref(formatDateISO(new Date()))

const displayDate = computed(() => {
  const parts = dateValue.value.split('-')
  return `${parts[0]}.${parts[1]}.${parts[2]}`
})

const { fileName, commendData, noticeData, loadFile } = useExcel()
const { takeScreenshot } = useScreenshot()

const commendRows = computed(() =>
  commendData.value.map(r => [
    r.name,
    r.department,
    r.eventType,
    r.event,
    r.cumulative + '次',
  ])
)

const noticeRows = computed(() =>
  noticeData.value.map(r => [
    r.name,
    r.department,
    r.eventType,
    r.event,
    r.basis,
    r.cumulative + '次',
  ])
)

function onScreenshot() {
  if (posterRef.value) {
    takeScreenshot(posterRef.value)
  }
}
</script>
