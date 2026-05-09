<template>
  <section class="assistant-page">
    <header class="assistant-header">
      <p class="eyebrow">独立项目 · 智能内容校正与管理评审工具</p>
      <h1>把材料发给我，我来做校正、评审和董事会呈现版</h1>
      <p>
        支持文字、图片、Excel、Word、PDF。默认尊重原文含义，所有修改都说明“原文 -> 修改后 -> 修改原因”。
      </p>
    </header>

    <main class="assistant-shell">
      <section class="chat-entry-card">
        <div class="assistant-avatar">AI</div>
        <div class="entry-content">
          <div class="entry-title">
            <h2>请输入或上传需要审核的内容</h2>
            <span>像对话一样提交材料</span>
          </div>

          <textarea
            v-model="sourceText"
            class="chat-textarea"
            placeholder="例如：粘贴制度、汇报材料、通知、经营分析、董事会草稿，或上传文件..."
          />

          <div class="entry-toolbar">
            <label class="upload-chip">
              上传文件
              <input
                type="file"
                accept=".txt,.xlsx,.xls,.docx,.pdf,.png,.jpg,.jpeg,.webp,.bmp,.gif"
                @change="onFileChange"
              />
            </label>
            <select v-model="industryId" class="review-select" aria-label="选择行业">
              <option v-for="industry in industryBenchmarks" :key="industry.id" :value="industry.id">
                {{ industry.name }}
              </option>
            </select>
            <button class="send-action" :disabled="isBusy || !sourceText.trim()" @click="startReview">
              {{ isBusy ? '处理中...' : '开始审核' }}
            </button>
          </div>

          <div v-if="extractedFile" class="file-summary">
            <strong>{{ extractedFile.fileName }}</strong>
            <span>{{ extractedFile.fileType }}</span>
          </div>
          <p v-if="statusMessage" class="status-message">{{ statusMessage }}</p>
          <ul v-if="warnings.length" class="warning-list">
            <li v-for="warning in warnings" :key="warning">{{ warning }}</li>
          </ul>
        </div>
      </section>

      <section class="quick-role-strip">
        <article v-for="role in reviewRoles" :key="role.id" class="role-pill">
          <strong>{{ role.name }}</strong>
          <span>{{ role.title }}</span>
        </article>
      </section>

      <section v-if="result" class="conversation-results">
        <article class="message user-message">
          <div class="message-avatar">你</div>
          <div class="message-bubble">
            <h3>已提交的原文</h3>
            <p>{{ sourceText }}</p>
          </div>
        </article>

        <article class="message assistant-message">
          <div class="message-avatar">AI</div>
          <div class="message-bubble">
            <h3>审核结果</h3>
            <div class="result-grid">
              <section v-for="section in result.sections" :key="section.title" class="result-section">
                <h4>{{ section.title }}</h4>
                <p>{{ section.summary }}</p>
                <ul>
                  <li v-for="item in section.items" :key="item">{{ item }}</li>
                </ul>
              </section>
            </div>
          </div>
        </article>

        <article class="message assistant-message">
          <div class="message-avatar">AI</div>
          <div class="message-bubble">
            <h3>修改追踪</h3>
            <div class="change-table-wrap">
              <table class="change-table">
                <thead>
                  <tr>
                    <th>原文</th>
                    <th>修改后</th>
                    <th>修改原因</th>
                    <th>是否改变含义</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(change, index) in result.changes" :key="index">
                    <td>{{ change.originalText }}</td>
                    <td>{{ change.revisedText }}</td>
                    <td>{{ change.reason }}</td>
                    <td>
                      <span :class="['meaning-badge', change.meaningChanged ? 'needs-confirm' : 'safe']">
                        {{ change.meaningChanged ? '是，需确认' : '否' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </article>

        <article class="message assistant-message">
          <div class="message-avatar">AI</div>
          <div class="message-bubble board-draft">
            <h3>董事会呈现版</h3>
            <p>{{ result.boardDraft }}</p>
          </div>
        </article>

        <article v-if="result.prompts.length" class="message assistant-message">
          <div class="message-avatar">AI</div>
          <div class="message-bubble">
            <h3>可复制审核提示词</h3>
            <p class="hint-text">用于接入 AI 后端或手动复制到 AI 工具执行。</p>
            <details v-for="prompt in result.prompts" :key="prompt.title" class="prompt-block">
              <summary>{{ prompt.title }}</summary>
              <textarea readonly :value="prompt.prompt" />
              <button class="secondary-action" @click="copyPrompt(prompt.prompt)">复制提示词</button>
            </details>
          </div>
        </article>
      </section>
    </main>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { industryBenchmarks } from './config/industryBenchmarks'
import { reviewRoles } from './config/reviewRoles'
import { extractDocumentText } from './services/documentExtractors'
import { runReviewPipeline } from './services/reviewPipeline'
import type { ExtractedDocument, ReviewPipelineResult } from './types/review'

const sourceText = ref('')
const industryId = ref('general')
const isBusy = ref(false)
const statusMessage = ref('')
const warnings = ref<string[]>([])
const extractedFile = ref<ExtractedDocument | null>(null)
const result = ref<ReviewPipelineResult | null>(null)

async function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  isBusy.value = true
  statusMessage.value = '正在提取文件内容...'
  warnings.value = []
  result.value = null

  try {
    const extracted = await extractDocumentText(file)
    extractedFile.value = extracted
    sourceText.value = extracted.text
    warnings.value = extracted.warnings
    statusMessage.value = extracted.text ? '文件内容已提取，请确认原文后开始审核。' : '文件已处理，但未提取到文字。'
  } catch (error) {
    statusMessage.value = error instanceof Error ? error.message : '文件解析失败。'
  } finally {
    isBusy.value = false
    target.value = ''
  }
}

async function startReview() {
  if (!sourceText.value.trim()) return

  isBusy.value = true
  statusMessage.value = '正在生成审核结果...'

  try {
    result.value = await runReviewPipeline({
      originalText: sourceText.value,
      industryId: industryId.value,
    })
    statusMessage.value = import.meta.env.VITE_AI_REVIEW_ENDPOINT
      ? '审核完成。'
      : '未配置 AI 后端，已生成可复制提示词。'
  } catch (error) {
    statusMessage.value = error instanceof Error ? error.message : '审核失败，请稍后重试。'
  } finally {
    isBusy.value = false
  }
}

async function copyPrompt(prompt: string) {
  await navigator.clipboard.writeText(prompt)
  statusMessage.value = '提示词已复制。'
}
</script>
