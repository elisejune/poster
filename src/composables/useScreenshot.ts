/**
 * 截图功能
 */

import html2canvas from 'html2canvas'
import { formatDateCompact } from '../utils/dateUtils'

export function useScreenshot() {
  async function takeScreenshot(element: HTMLElement) {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
      width: element.scrollWidth,
      height: element.scrollHeight,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    })
    const link = document.createElement('a')
    link.download = `黑板报_${formatDateCompact(new Date())}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return { takeScreenshot }
}
