import type { JournalArticle } from '../types/journal-article.types'

export const mockJournalArticles: JournalArticle[] = [
  {
    id: 'journal-article-liquidity-ceiling',
    sourceNodeId: 'node_001',
    title: 'XAUUSD: Tactical Reversal at Liquidity Ceiling',
    subtitle: 'Strategic setup',
    description: 'A clean board for mapping the article thesis, liquidity context, and future discussion blocks without loading the page with full article content yet.',
    category: 'Price Action',
    author: 'Eve Research Desk',
    publishedAt: '2026-01-18T10:30:00Z',
    metrics: [
      { id: 'likes', label: 'Likes', value: 142 },
      { id: 'comments', label: 'Comments', value: 2 },
      { id: 'read-time', label: 'Read Time', value: '7 min' },
      { id: 'confidence', label: 'Confidence', value: '4/5' }
    ],
    boardBlocks: []
  }
]

export const mockJournalArticle = mockJournalArticles[0]
