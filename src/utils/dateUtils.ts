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
