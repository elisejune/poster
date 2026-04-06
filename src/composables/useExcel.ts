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
  let lastFile: File | null = null

  function loadFile(file: File) {
    lastFile = file
    fileName.value = file.name
    return parseFile(file)
  }

  function refresh(): Promise<void> {
    if (!lastFile) {
      return Promise.reject(new Error('no-file'))
    }
    return parseFile(lastFile)
  }

  function parseFile(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const data = new Uint8Array(e.target!.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        commendData.value = parseCommendData(workbook)
        noticeData.value = parseNoticeData(workbook)
        resolve()
      }
      reader.onerror = () => reject(reader.error)
      reader.readAsArrayBuffer(file)
    })
  }

  return { fileName, commendData, noticeData, loadFile, refresh }
}
