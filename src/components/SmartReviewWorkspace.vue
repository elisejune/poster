<template>
  <section class="review-workspace">
    <div class="review-hero">
      <div>
        <p class="eyebrow">智能内容校正与管理评审工具</p>
        <h1>原文保真、行业对标、专家评审、董事会呈现</h1>
        <p>
          支持文本、图片、Excel、Word、PDF。所有修改都必须说明“从什么改成什么”，可能改变含义的内容会标记为需确认。
        </p>
      </div>
      <div class="review-guardrail">
        <strong>核心规则</strong>
        <span>默认遵循原文，不擅自改变事实、立场和结论。</span>
      </div>
    </div>

    <div class="review-grid">
      <div class="review-card">
        <div class="section-heading">
          <span>1</span>
          <div>
            <h2>输入内容</h2>
            <p>可粘贴文字，或上传 txt、xlsx、docx、pdf、图片。</p>
          </div>
        </div>

        <textarea
          v-model="sourceText"
          class="review-textarea"
          placeholder="请粘贴需要校正和评审的原文..."
        />

        <div class="review-actions">
          <label class="upload-chip">
            上传文件
            <input
              type="file"
              accept=".txt,.xlsx,.xls,.docx,.pdf,.png,.jpg,.jpeg,.webp,.bmp,.gif"
              @change="onFileChange"
            />
          </label>
          <select v-model="industryId" class="review-select">
            <option v-for="industry in industryBenchmarks" :key="industry.id" :value="industry.id">
              {{ industry.name }}
            </option>
          </select>
          <button class="primary-action" :disabled="isBusy || !sourceText.trim()" @click="startReview">
            {{ isBusy ? '审核中...' : '开始审核' }}
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

      <div class="review-card">
        <div class="section-heading">
          <span>2</span>
          <div>
            <h2>角色与审核链路</h2>
            <p>产品经理已把需求拆成稳定流程，并由多角色协同审核。</p>
          </div>
        </div>

        <div class="role-list">
          <article v-for="role in reviewRoles" :key="role.id" class="role-item">
            <h3>{{ role.title }}</h3>
            <strong>{{ role.name }}</strong>
            <p>{{ role.goal }}</p>
          </article>
        </div>
      </div>
    </div>

    <div class="review-card full-width">
      <div class="section-heading">
        <span>3</span>
        <div>
          <h2>审核结果</h2>
          <p>如未配置 AI 后端，系统会输出可复制的完整提示词。</p>
        </div>
      </div>

      <div class="result-grid">
        <article v-for="section in result?.sections" :key="section.title" class="result-section">
          <h3>{{ section.title }}</h3>
          <p>{{ section.summary }}</p>
          <ul>
            <li v-for="item in section.items" :key="item">{{ item }}</li>
          </ul>
        </article>
      </div>

      <div v-if="result" class="change-table-wrap">
        <h3>修改追踪</h3>
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

      <div v-if="result" class="board-draft">
        <h3>董事会呈现版</h3>
        <p>{{ result.boardDraft }}</p>
      </div>
    </div>

    <div v-if="result?.prompts.length" class="review-card full-width">
      <div class="section-heading">
        <span>4</span>
        <div>
          <h2>可复制审核提示词</h2>
          <p>用于接入 AI 后端或手动复制到 AI 工具执行。</p>
        </div>
      </div>

      <details v-for="prompt in result.prompts" :key="prompt.title" class="prompt-block">
        <summary>{{ prompt.title }}</summary>
        <textarea readonly :value="prompt.prompt" />
        <button class="secondary-action" @click="copyPrompt(prompt.prompt)">复制提示词</button>
      </details>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { industryBenchmarks } from '../config/industryBenchmarks'
import { reviewRoles } from '../config/reviewRoles'
import { extractDocumentText } from '../services/documentExtractors'
import { runReviewPipeline } from '../services/reviewPipeline'
import type { ExtractedDocument, ReviewPipelineResult } from '../types/review'

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
