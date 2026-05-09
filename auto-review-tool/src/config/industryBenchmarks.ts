import type { IndustryBenchmark } from '../types/review'

export const industryBenchmarks: IndustryBenchmark[] = [
  {
    id: 'general',
    name: '通用企业管理',
    focusAreas: ['战略一致性', '经营结果', '流程闭环', '组织协同', '风险控制'],
    metrics: ['收入增长', '利润率', '成本效率', '客户满意度', '项目达成率'],
    bestPractices: ['目标分解到责任人', '过程指标与结果指标结合', '复盘机制常态化'],
    risks: ['目标不清', '责任不明', '缺少量化指标', '行动无法闭环'],
  },
  {
    id: 'manufacturing',
    name: '制造业',
    focusAreas: ['质量管理', '产能效率', '供应链稳定', '安全生产', '精益改善'],
    metrics: ['良品率', 'OEE', '交付准时率', '库存周转率', '安全事故率'],
    bestPractices: ['精益生产', '全面质量管理', '供应商分级管理', '设备预防性维护'],
    risks: ['质量波动', '产能瓶颈', '交付延迟', '库存积压', '安全隐患'],
  },
  {
    id: 'retail-service',
    name: '零售/服务业',
    focusAreas: ['客户体验', '门店/渠道效率', '服务标准化', '会员运营', '投诉闭环'],
    metrics: ['客单价', '复购率', '转化率', 'NPS', '投诉解决时长'],
    bestPractices: ['客户旅程管理', '服务 SOP', '会员分层运营', '一线反馈闭环'],
    risks: ['体验不一致', '客户流失', '服务承诺无法兑现', '一线执行弱'],
  },
  {
    id: 'internet-software',
    name: '互联网/软件',
    focusAreas: ['用户价值', '产品迭代', '数据驱动', '系统稳定性', '增长效率'],
    metrics: ['活跃用户', '留存率', '转化率', 'SLA', '研发交付周期'],
    bestPractices: ['敏捷迭代', 'A/B 测试', '数据看板', '用户反馈闭环', '灰度发布'],
    risks: ['需求失焦', '技术债累积', '数据口径不一', '线上稳定性风险'],
  },
  {
    id: 'finance',
    name: '金融',
    focusAreas: ['合规经营', '风险定价', '客户资产安全', '内控审计', '经营稳健性'],
    metrics: ['不良率', '资本充足率', '合规事件数', '客户投诉率', '风险调整收益'],
    bestPractices: ['三道防线', '穿透式风控', '合规前置审核', '压力测试'],
    risks: ['合规风险', '信用风险', '操作风险', '声誉风险', '数据安全风险'],
  },
  {
    id: 'healthcare',
    name: '医疗',
    focusAreas: ['医疗质量', '患者安全', '合规管理', '服务效率', '数据隐私'],
    metrics: ['患者满意度', '平均等待时长', '差错率', '感染率', '投诉率'],
    bestPractices: ['临床路径管理', '患者安全核查', '分级诊疗协同', '隐私保护机制'],
    risks: ['医疗安全风险', '隐私泄露', '流程不规范', '合规风险'],
  },
  {
    id: 'education',
    name: '教育',
    focusAreas: ['教学质量', '学习效果', '师资管理', '课程体系', '家校沟通'],
    metrics: ['完课率', '学习达成率', '续费率', '满意度', '师生比'],
    bestPractices: ['学习闭环设计', '课程标准化', '教学质量评估', '个性化反馈'],
    risks: ['效果不可量化', '师资不稳定', '课程交付不一致', '合规风险'],
  },
  {
    id: 'public-sector',
    name: '政企/公共服务',
    focusAreas: ['政策合规', '公共价值', '服务效率', '协同治理', '风险预案'],
    metrics: ['办理时长', '群众满意度', '事项办结率', '投诉率', '风险响应时长'],
    bestPractices: ['一站式服务', '事项标准化', '跨部门协同', '公开透明机制'],
    risks: ['流程复杂', '责任边界不清', '舆情风险', '政策执行偏差'],
  },
]

export function getIndustryBenchmark(industryId: string) {
  return industryBenchmarks.find(item => item.id === industryId) || industryBenchmarks[0]
}
