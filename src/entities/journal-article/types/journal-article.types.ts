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

export type JournalArticleBoardNodeType = 'text' | 'image' | 'drawing'

export interface JournalArticleBoardPosition {
  x: number
  y: number
}

export interface JournalArticleBoardSize {
  width: number
  height: number
}

export interface JournalArticleBoardBaseNode {
  id: string
  type: JournalArticleBoardNodeType
  position: JournalArticleBoardPosition
  size: JournalArticleBoardSize
  isEditing?: boolean
}

export interface JournalArticleBoardTextNode extends JournalArticleBoardBaseNode {
  type: 'text'
  title: string
  text: string
}

export interface JournalArticleBoardImageNode extends JournalArticleBoardBaseNode {
  type: 'image'
  src: string
  alt: string
  caption?: string
}

export interface JournalArticleBoardDrawingNode extends JournalArticleBoardBaseNode {
  type: 'drawing'
  params?: {
    strokes?: any[]
  }
}

export type JournalArticleBoardNode = JournalArticleBoardTextNode | JournalArticleBoardImageNode | JournalArticleBoardDrawingNode

export interface JournalArticleBoardGridMagnet {
  enabled: boolean
  mode: 'grid'
}

export interface JournalArticleBoard {
  gridSize: number
  magnet: JournalArticleBoardGridMagnet
  size: JournalArticleBoardSize
  nodes: JournalArticleBoardNode[]
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
  board: JournalArticleBoard
  boardBlocks: JournalArticleBoardBlock[]
}
