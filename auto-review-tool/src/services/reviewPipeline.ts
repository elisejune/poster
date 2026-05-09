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
      title: '6. 产品经理需求细化与落地',
      prompt: [
        fidelityBlock,
        sourceBlock,
        expertPrompt('product-manager'),
        '请把原文需求和前面审核建议整理成稳定 PRD，输出产品目标、用户场景、功能清单、流程、页面结构、字段/输出格式、优先级和验收标准。',
        '必须区分“原文明确提出的需求”和“产品经理建议补充的落地内容”。',
      ].join('\n\n'),
    },
    {
      title: '7. 总经理审核与董事会呈现版',
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
      stage: 'language',
      title: '错别字与语句通顺审核',
      summary: '语言审核会检查错别字、标点、病句、语义重复、前后矛盾和语句不通顺问题。',
      items: [
        '所有修改都必须输出“原文 -> 修改后 -> 修改原因”。',
        '不改变原文事实、立场、结论和判断口径。',
        '可能改变含义的修改会标记为“需用户确认”。',
      ],
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
    {
      stage: 'expert',
      title: '三位管理专家评审',
      summary: '战略、运营、组织绩效三位专家会分别给出建议，并区分原文已有依据和建议补充。',
      items: [
        '战略与商业模式专家：评估战略价值、商业模式、决策关注点和潜在风险。',
        '卓越运营与流程专家：评估流程、责任、KPI 和管理闭环。',
        '组织绩效与变革专家：评估组织影响、绩效牵引、变革风险和落地保障。',
      ],
    },
    {
      stage: 'copy',
      title: '文案校正者优化',
      summary: '文案校正者会把内容优化为自然、简洁、一看就懂、可执行落地的表达。',
      items: [
        '去除机器化、空泛和重复表达。',
        '保留原文含义，不擅自增删事实。',
        '每一处改写都保留修改追踪记录。',
      ],
    },
    {
      stage: 'productManager',
      title: '产品经理落地',
      summary: '产品经理会把审核建议转化为 PRD、功能清单、用户流程、页面结构和验收标准。',
      items: ['稳定需求文档', '功能优先级', '页面交互', '验收标准', '后续迭代建议'],
    },
    {
      stage: 'generalManager',
      title: '总经理审核与董事会呈现',
      summary: '总经理会从董事会视角审核经营价值、风险、资源需求和待决策事项。',
      items: [
        '检查是否说清问题、原因、措施、结果。',
        '明确董事会摘要、行动建议和待决策事项。',
        '标注哪些内容来自原文，哪些属于建议补充。',
      ],
    },
  ]

  return {
    prompts,
    sections,
    changes: createInitialChangeGuides(),
    boardDraft: [
      '配置 VITE_AI_REVIEW_ENDPOINT 后可自动生成董事会呈现版。',
      '当前页面已生成完整分阶段提示词，可复制到 AI 工具执行。',
      '董事会呈现版将包含：原文核心摘要、经营价值、风险与应对、行动建议、待决策事项，并明确区分“原文已有内容”和“建议补充内容”。',
    ].join('\n'),
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
