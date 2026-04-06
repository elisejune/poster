/**
 * Excel 数据解析与筛选
 *
 * 筛选规则：状态非"（驳回）取消发布"且非"已发布"
 * 累计规则：同一姓名 + 同一依据，状态非"（驳回）取消发布"的有效记录数
 */

import * as XLSX from 'xlsx'
import { parseChineseDate } from './dateUtils'

/** 表扬通报行 */
export interface CommendRow {
  name: string
  department: string
  eventType: string
  event: string
  cumulative: number
  date: Date | null
}

/** 违规通报行 */
export interface NoticeRow {
  name: string
  department: string
  eventType: string
  event: string
  basis: string
  cumulative: number
  date: Date | null
}

/**
 * 查找以指定前缀开头的列名（Excel 列名可能带换行后缀）
 */
function findKey(keys: string[], prefix: string): string | undefined {
  return keys.find(k => k.startsWith(prefix))
}

/**
 * 解析 Excel 单元格中的日期值
 */
function parseExcelDate(value: unknown): Date | null {
  if (value == null) return null
  // Excel 序列号
  if (typeof value === 'number') {
    const epoch = new Date(1899, 11, 30)
    return new Date(epoch.getTime() + value * 86400000)
  }
  // 中文日期或其他字符串
  return parseChineseDate(String(value))
}

/**
 * 判断是否为有效记录（非取消发布）
 */
function isValid(row: Record<string, unknown>): boolean {
  return String(row['状态'] || '') !== '（驳回）取消发布'
}

/**
 * 判断是否为待发布记录（非取消、非已发布）
 */
function isPending(row: Record<string, unknown>): boolean {
  const status = String(row['状态'] || '')
  return status !== '（驳回）取消发布' && status !== '已发布'
}

/**
 * 按 姓名+依据 统计累计次数
 */
function buildCumulativeMap(
  rows: Record<string, unknown>[],
  basisKey: string
): Map<string, number> {
  const map = new Map<string, number>()
  for (const row of rows) {
    if (!isValid(row)) continue
    const name = String(row['姓名'] || '')
    const basis = String(row[basisKey] || '')
    if (name && basis) {
      const key = `${name}||${basis}`
      map.set(key, (map.get(key) || 0) + 1)
    }
  }
  return map
}

/**
 * 从 workbook 中解析表扬通报数据
 */
export function parseCommendData(workbook: XLSX.WorkBook): CommendRow[] {
  const sheet = workbook.Sheets['【表扬】通报登记清单-表扬']
  if (!sheet) return []

  const allRows = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[]
  if (allRows.length === 0) return []

  const keys = Object.keys(allRows[0])
  const contentKey = findKey(keys, '表扬内容') || ''
  const basisKey = findKey(keys, '表扬依据') || ''

  const dateKey = findKey(keys, '事件发生时间') || '事件发生时间'

  const cumulativeMap = buildCumulativeMap(allRows, basisKey)
  const filtered = allRows.filter(isPending)

  return filtered.map(row => {
    const name = String(row['姓名'] || '')
    const basis = String(basisKey ? (row[basisKey] || '') : '')
    const key = `${name}||${basis}`
    return {
      name,
      department: String(row['处室'] || ''),
      eventType: String(row['通报事件类型'] || ''),
      event: String(contentKey ? (row[contentKey] || '') : ''),
      cumulative: cumulativeMap.get(key) || 0,
      date: parseExcelDate(row[dateKey]),
    }
  })
}

/**
 * 从 workbook 中解析违规通报数据
 */
export function parseNoticeData(workbook: XLSX.WorkBook): NoticeRow[] {
  const sheet = workbook.Sheets['【批评】通报登记清单-批评']
  if (!sheet) return []

  const allRows = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[]
  if (allRows.length === 0) return []

  const keys = Object.keys(allRows[0])
  const contentKey = findKey(keys, '批评内容') || ''

  const dateKey = findKey(keys, '事件发生时间') || '事件发生时间'

  const cumulativeMap = buildCumulativeMap(allRows, '批评依据')
  const filtered = allRows.filter(isPending)

  return filtered.map(row => {
    const name = String(row['姓名'] || '')
    const basis = String(row['批评依据'] || '')
    const key = `${name}||${basis}`
    return {
      name,
      department: String(row['处室'] || ''),
      eventType: String(row['通报事件类型'] || ''),
      event: String(contentKey ? (row[contentKey] || '') : ''),
      basis,
      cumulative: cumulativeMap.get(key) || 0,
      date: parseExcelDate(row[dateKey]),
    }
  })
}
