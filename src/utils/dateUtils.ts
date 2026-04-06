/**
 * 日期工具函数
 */

/**
 * 解析中文日期 "2025年12月23日" -> Date
 */
export function parseChineseDate(str: string | undefined | null): Date | null {
  if (!str) return null
  const m = String(str).match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)
  if (m) return new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]))
  const d = new Date(str)
  return isNaN(d.getTime()) ? null : d
}

/**
 * 格式化日期为 "YYYY.MM.DD"
 */
export function formatDateDot(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}.${m}.${d}`
}

/**
 * 格式化日期为 "YYYY-MM-DD"（用于 input[type=date]）
 */
export function formatDateISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * 格式化日期为 "YYYYMMDD"（用于文件名）
 */
export function formatDateCompact(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

/**
 * 判断日期是否在 [weekStart, weekEnd] 范围内（即 endDate 前一周）
 * endDate 为选定日期，范围为 endDate-6 ~ endDate
 */
export function isInPreviousWeek(date: Date | null, endDate: Date): boolean {
  if (!date) return false
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999)
  const start = new Date(end)
  start.setDate(start.getDate() - 6)
  start.setHours(0, 0, 0, 0)
  return date >= start && date <= end
}
