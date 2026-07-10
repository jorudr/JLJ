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

export interface JournalArticle {
  id: string
  sourceNodeId?: string
  title: string
  subtitle: string
  category: string
  author: string
  publishedAt: string
  boardBlocks: JournalArticleBoardBlock[]
}
