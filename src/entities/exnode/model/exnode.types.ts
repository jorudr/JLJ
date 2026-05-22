export type ExNodeMode = 'SETUP' | 'RESEARCH' | 'LESSON' | 'QUESTION'

export interface ExNodeMetric {
  label: string
  value: number
}

export interface ExNodeLevels {
  tp: string
  sl: string
}

export interface ExNode {
  id: string
  mode: ExNodeMode
  title: string
  category: string
  confidence?: number
  thesis_brief?: string
  tags: string[]
  likesCount: number
  repliesCount: number
  lastActivityAt: string
  setupLevels?: ExNodeLevels
  metrics?: ExNodeMetric[]
  steps?: string[]
  blocks?: ExNodeBlock[]
}

export type ExNodeBlock = 
  | { type: 'paragraph'; text: string }
  | { type: 'header'; text: string; level: 1 | 2 | 3 }
  | { type: 'quote'; text: string; author?: string }
  | { type: 'divider' }
