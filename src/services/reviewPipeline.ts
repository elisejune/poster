import { getIndustryBenchmark } from '../config/industryBenchmarks'
import { fidelityPrinciples, reviewRoles } from '../config/reviewRoles'
import type {
  PipelinePrompt,
  ReviewChange,
  ReviewPipelineInput,
  ReviewPipelineResult,
  ReviewSection,
} from '../types/review'

export async function runReviewPipeline(input: ReviewPipelineInput): Promise<ReviewPipelineResult> {
  const prompts = createReviewPrompts(input)
  const endpoint = import.meta.env.VITE_AI_REVIEW_ENDPOINT

  if (!endpoint) {
    return createPromptOnlyResult(input, prompts)
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      originalText: input.originalText,
      industry: getIndustryBenchmark(input.industryId),
      roles: reviewRoles,
      fidelityPrinciples,
      prompts,
      requiredOutputSchema: {
        sections: 'ReviewSection[]',
        changes: 'ReviewChange[]',
        boardDraft: 'string',
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`AI 审核接口调用失败：${response.status}`)
  }

  const payload = await response.json()
  return {
    prompts,
    sections: Array.isArray(payload.sections) ? payload.sections : [],
    changes: Array.isArray(payload.changes) ? payload.changes : [],
    boardDraft: typeof payload.boardDraft === 'string' ? payload.boardDraft : '',
  }
}

export function createReviewPrompts(input: ReviewPipelineInput): PipelinePrompt[] {
  const industry = getIndustryBenchmark(input.industryId)
  const source = input.originalText.trim()
  const sourceBlock = `【原文】\n${source}`
  const fidelityBlock = `【不可违反的原文保护规则】\n${fidelityPrinciples.map(item => `- ${item}`).join('\n')}`
  const changeSchema = [
    '所有文字修改必须使用以下格式：',
    '- 原文：',
    '- 修改后：',
    '- 修改原因：',
    '- 是否改变含义：是/否',
    '- 置信度：高/中/低',
    '若改变含义，必须标记为“需用户确认”，不得自动合入最终稿。',
  ].join('\n')

  return [
    {
      title: '1. 原文含义保真检查',
      prompt: [
        fidelityBlock,
        sourceBlock,
        '请提取原文核心事实、观点、结论和不可擅自改变的边界条件。',
        '输出“原文核心摘要”“不可改变事项”“可能需要用户确认的模糊点”。',
      ].join('\n\n'),
    },
    {
      title: '2. 错别字与语句通顺审核',
      prompt: [
        fidelityBlock,
        changeSchema,
        sourceBlock,
        '请检查错别字、别字、标点错误、病句、重复表达、指代不清、前后矛盾和逻辑跳跃。',
        '只允许在不改变原文含义的前提下修改表达。',
      ].join('\n\n'),
    },
    {
      title: '3. 行业信息对标审核',
      prompt: [
        fidelityBlock,
        sourceBlock,
        `【行业】${industry.name}`,
        `【行业关注点】${industry.focusAreas.join('、')}`,
        `【常用指标】${industry.metrics.join('、')}`,
        `【先进实践】${industry.bestPractices.join('、')}`,
        `【典型风险】${industry.risks.join('、')}`,
        '请判断原文与行业先进管理实践的差距。行业信息只能作为“建议补充/风险提示”，不得改写原文事实或结论。',
      ].join('\n\n'),
    },
    {
      title: '4. 三位专家评审',
      prompt: [
        fidelityBlock,
        sourceBlock,
        expertPrompt('strategy-expert'),
        expertPrompt('operations-expert'),
        expertPrompt('organization-expert'),
        '请分别输出三位专家的评审意见，区分“原文已有依据”和“建议补充”。',
      ].join('\n\n'),
    },
    {
      title: '5. 文案校正者优化',
      prompt: [
        fidelityBlock,
        changeSchema,
        sourceBlock,
        expertPrompt('copy-editor'),
        '请把内容优化成自然、简洁、一看就懂、可执行落地的表达。',
        '不得改变原文含义；如必须调整含义，请单独列为“需用户确认”。',
      ].join('\n\n'),
    },
    {
      title: '6. 总经理审核与董事会呈现版',
      prompt: [
        fidelityBlock,
        sourceBlock,
        expertPrompt('general-manager'),
        '请从总经理视角审核内容是否可提交董事会，输出董事会摘要、经营价值、风险与应对、资源需求、待决策事项。',
        '最终稿必须标注哪些来自原文，哪些是建议补充。',
      ].join('\n\n'),
    },
  ]
}

function createPromptOnlyResult(input: ReviewPipelineInput, prompts: PipelinePrompt[]): ReviewPipelineResult {
  const industry = getIndustryBenchmark(input.industryId)
  const sections: ReviewSection[] = [
    {
      stage: 'fidelity',
      title: '原文含义保护',
      summary: '当前未配置 AI 审核接口，系统已生成完整审核提示词。请复制提示词到 AI 工具执行审核。',
      items: fidelityPrinciples,
    },
    {
      stage: 'industry',
      title: `行业对标：${industry.name}`,
      summary: '行业对标将围绕关注点、指标、先进实践和典型风险输出建议补充。',
      items: [
        `关注点：${industry.focusAreas.join('、')}`,
        `指标：${industry.metrics.join('、')}`,
        `先进实践：${industry.bestPractices.join('、')}`,
        `风险：${industry.risks.join('、')}`,
      ],
    },
  ]

  return {
    prompts,
    sections,
    changes: createInitialChangeGuides(),
    boardDraft: '配置 VITE_AI_REVIEW_ENDPOINT 后可自动生成董事会呈现版；当前可复制下方提示词到 AI 工具生成。',
  }
}

function createInitialChangeGuides(): ReviewChange[] {
  return [
    {
      originalText: '原文中的具体句子',
      revisedText: '保持原意后的优化句子',
      changeType: 'clarity',
      reason: '示例：减少冗余表达，使句子更清晰。',
      meaningChanged: false,
      confidence: 'high',
    },
    {
      originalText: '原文未明确说明的信息',
      revisedText: '建议补充的信息或判断',
      changeType: 'industrySuggestion',
      reason: '示例：行业对标发现该项信息有助于董事会判断，但原文未提供事实依据。',
      meaningChanged: true,
      confidence: 'medium',
    },
  ]
}

function expertPrompt(roleId: string): string {
  const role = reviewRoles.find(item => item.id === roleId)
  if (!role) return ''

  return [
    `【${role.title}：${role.name}】`,
    `目标：${role.goal}`,
    `职责：${role.responsibilities.join('；')}`,
    `输出重点：${role.outputFocus.join('、')}`,
  ].join('\n')
}
