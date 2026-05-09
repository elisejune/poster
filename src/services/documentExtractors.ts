import * as XLSX from 'xlsx'
import type { ExtractedDocument } from '../types/review'

const imageExtensions = ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif']

export async function extractDocumentText(file: File): Promise<ExtractedDocument> {
  const extension = getExtension(file.name)
  const warnings: string[] = []
  let text = ''

  if (file.type.startsWith('text/') || extension === 'txt') {
    text = await file.text()
  } else if (extension === 'xlsx' || extension === 'xls') {
    text = await extractExcelText(file)
  } else if (extension === 'docx') {
    text = await extractWordText(file)
  } else if (extension === 'pdf') {
    text = await extractPdfText(file)
  } else if (imageExtensions.includes(extension)) {
    warnings.push('图片识别依赖浏览器 OCR，图片较大时可能需要等待。')
    text = await extractImageText(file)
  } else {
    throw new Error(`暂不支持该文件类型：${extension || file.type || '未知类型'}`)
  }

  const normalizedText = normalizeText(text)
  if (!normalizedText) {
    warnings.push('未能提取到有效文字，请确认文件内容是否可复制或图片是否清晰。')
  }

  return {
    fileName: file.name,
    fileType: extension || file.type,
    text: normalizedText,
    warnings,
  }
}

async function extractExcelText(file: File): Promise<string> {
  const data = new Uint8Array(await file.arrayBuffer())
  const workbook = XLSX.read(data, { type: 'array' })

  return workbook.SheetNames.map((sheetName) => {
    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
    if (rows.length === 0) return `【${sheetName}】\n（空表）`

    const lines = rows.map((row, index) => {
      const cells = Object.entries(row)
        .filter(([, value]) => String(value).trim() !== '')
        .map(([key, value]) => `${key}：${String(value).trim()}`)
      return `第 ${index + 1} 行：${cells.join('；')}`
    })
    return `【${sheetName}】\n${lines.join('\n')}`
  }).join('\n\n')
}

async function extractWordText(file: File): Promise<string> {
  const mammoth = await import('mammoth')
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
  return result.value
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString()

  const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise
  const pages: string[] = []
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber)
    const content = await page.getTextContent()
    const pageText = content.items
      .map(item => ('str' in item ? item.str : ''))
      .join(' ')
    pages.push(`第 ${pageNumber} 页：\n${pageText}`)
  }
  return pages.join('\n\n')
}

async function extractImageText(file: File): Promise<string> {
  const { recognize } = await import('tesseract.js')
  const result = await recognize(file, 'chi_sim+eng')
  return result.data.text
}

function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function getExtension(fileName: string): string {
  const match = fileName.toLowerCase().match(/\.([^.]+)$/)
  return match?.[1] || ''
}
