export type ReviewStage =
  | 'fidelity'
  | 'language'
  | 'industry'
  | 'expert'
  | 'copy'
  | 'generalManager'

export type ChangeType =
  | 'typo'
  | 'grammar'
  | 'punctuation'
  | 'clarity'
  | 'structure'
  | 'industrySuggestion'
  | 'boardSuggestion'

export interface ReviewRole {
  id: string
  name: string
  title: string
  goal: string
  responsibilities: string[]
  outputFocus: string[]
}

export interface IndustryBenchmark {
  id: string
  name: string
  focusAreas: string[]
  metrics: string[]
  bestPractices: string[]
  risks: string[]
}

export interface ReviewChange {
  originalText: string
  revisedText: string
  changeType: ChangeType
  reason: string
  meaningChanged: boolean
  confidence: 'high' | 'medium' | 'low'
}

export interface ReviewSection {
  stage: ReviewStage
  title: string
  summary: string
  items: string[]
}

export interface PipelinePrompt {
  title: string
  prompt: string
}

export interface ExtractedDocument {
  fileName: string
  fileType: string
  text: string
  warnings: string[]
}

export interface ReviewPipelineInput {
  originalText: string
  industryId: string
}

export interface ReviewPipelineResult {
  prompts: PipelinePrompt[]
  sections: ReviewSection[]
  changes: ReviewChange[]
  boardDraft: string
}
