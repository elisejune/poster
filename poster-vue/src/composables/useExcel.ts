/**
 * Excel 文件上传与数据管理
 */

import { ref, type Ref } from 'vue'
import * as XLSX from 'xlsx'
import {
  parseCommendData,
  parseNoticeData,
  type CommendRow,
  type NoticeRow,
} from '../utils/excelParser'

export function useExcel() {
  const fileName: Ref<string> = ref('未选择文件')
  const commendData: Ref<CommendRow[]> = ref([])
  const noticeData: Ref<NoticeRow[]> = ref([])

  function loadFile(file: File) {
    fileName.value = file.name
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = new Uint8Array(e.target!.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      commendData.value = parseCommendData(workbook)
      noticeData.value = parseNoticeData(workbook)
    }
    reader.readAsArrayBuffer(file)
  }

  return { fileName, commendData, noticeData, loadFile }
}
