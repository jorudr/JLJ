export type JournalArticleBlockSize = 'hero' | 'wide' | 'tall' | 'medium' | 'small'

export type JournalArticleTextSize = 'compact' | 'regular' | 'large'

export interface JournalArticleBoardBlock {
  id: string
  label: string
  title: string
  text: string
  size: JournalArticleBlockSize
  textSize: JournalArticleTextSize
}

export interface JournalArticleMetric {
  id: string
  label: string
  value: string | number
}

export interface JournalArticle {
  id: string
  sourceNodeId?: string
  title: string
  subtitle: string
  description: string
  category: string
  author: string
  publishedAt: string
  metrics: JournalArticleMetric[]
  boardBlocks: JournalArticleBoardBlock[]
}
