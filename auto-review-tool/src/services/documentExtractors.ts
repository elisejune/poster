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
  const ExcelJS = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(await file.arrayBuffer())

  const sheets: string[] = []
  workbook.eachSheet((worksheet) => {
    const headers = readWorksheetHeaders(worksheet)
    const lines: string[] = []

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return
      const cells: string[] = []
      row.eachCell((cell, colNumber) => {
        const value = formatCellValue(cell.value)
        if (!value) return
        const header = headers[colNumber] || `第 ${colNumber} 列`
        cells.push(`${header}：${value}`)
      })
      if (cells.length > 0) {
        lines.push(`第 ${rowNumber - 1} 行：${cells.join('；')}`)
      }
    })

    sheets.push(`【${worksheet.name}】\n${lines.length ? lines.join('\n') : '（空表）'}`)
  })

  return sheets.join('\n\n')
}

function readWorksheetHeaders(worksheet: import('exceljs').Worksheet): Record<number, string> {
  const headers: Record<number, string> = {}
  const headerRow = worksheet.getRow(1)
  headerRow.eachCell((cell, colNumber) => {
    const value = formatCellValue(cell.value)
    if (value) headers[colNumber] = value
  })
  return headers
}

function formatCellValue(value: import('exceljs').CellValue): string {
  if (value == null) return ''
  if (value instanceof Date) return value.toLocaleDateString()
  if (typeof value === 'object') {
    if ('text' in value && value.text) return String(value.text).trim()
    if ('result' in value && value.result != null) return String(value.result).trim()
    if ('richText' in value && Array.isArray(value.richText)) {
      return value.richText.map(item => item.text).join('').trim()
    }
  }
  return String(value).trim()
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
