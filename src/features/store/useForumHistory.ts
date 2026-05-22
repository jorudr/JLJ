import { defineStore } from 'pinia'
import type { Thread } from '~/entities/thread/model/thread.types'

export interface HistoryItem {
  id: string
  title: string
  authorId: string
  authorName: string // New field
  category: string
  subcategory: string
  viewedAt: number // Timestamp
  likesCount?: number
}

export const useForumHistoryStore = defineStore('forumHistory', {
  state: () => ({
    history: [] as HistoryItem[],
    searchQuery: '',
    timeFilter: 'all' as 'all' | 'today' | 'week' | 'month',
    categoryFilter: 'all' as string
  }),

  getters: {
    availableCategories(state) {
      const cats = new Set(state.history.map(h => h.category))
      return Array.from(cats).sort()
    },

    filteredHistory(state) {
      const now = Date.now()
      const oneDay = 24 * 60 * 60 * 1000
      const oneWeek = 7 * oneDay
      const oneMonth = 30 * oneDay

      return state.history
        .filter(item => {
          // Search filter
          const matchesSearch = item.title.toLowerCase().includes(state.searchQuery.toLowerCase())
          
          // Time filter
          let matchesTime = true
          if (state.timeFilter === 'today') {
            matchesTime = (now - item.viewedAt) < oneDay
          } else if (state.timeFilter === 'week') {
            matchesTime = (now - item.viewedAt) < oneWeek
          } else if (state.timeFilter === 'month') {
            matchesTime = (now - item.viewedAt) < oneMonth
          }

          // Category filter
          const matchesCategory = state.categoryFilter === 'all' || item.category === state.categoryFilter

          return matchesSearch && matchesTime && matchesCategory
        })
        .sort((a, b) => b.viewedAt - a.viewedAt)
    },

    groupedHistory() {
      const items = this.filteredHistory
      const groups: Record<'Today' | 'Earlier this Week' | 'This Month' | 'Older', HistoryItem[]> = {
        'Today': [],
        'Earlier this Week': [],
        'This Month': [],
        'Older': []
      }

      const now = new Date()
      now.setHours(0, 0, 0, 0)
      const todayStart = now.getTime()
      const weekStart = todayStart - (7 * 24 * 60 * 60 * 1000)
      const monthStart = todayStart - (30 * 24 * 60 * 60 * 1000)

      items.forEach(item => {
        if (item.viewedAt >= todayStart) {
          groups['Today'].push(item)
        } else if (item.viewedAt >= weekStart) {
          groups['Earlier this Week'].push(item)
        } else if (item.viewedAt >= monthStart) {
          groups['This Month'].push(item)
        } else {
          groups['Older'].push(item)
        }
      })

      // Remove empty groups
      return Object.entries(groups).filter(([_, items]) => items.length > 0)
    }
  },

  actions: {
    addThreadToHistory(thread: Thread, authorName: string) {
      if (!thread) return

      // Remove existing entry for this thread if it exists
      this.history = this.history.filter(item => item.id !== thread.id)

      // Add new entry at the beginning
      this.history.unshift({
        id: thread.id,
        title: thread.title,
        authorId: thread.authorId,
        authorName: authorName || 'Anonymous', // Store the name
        category: thread.category,
        subcategory: thread.subcategory,
        viewedAt: Date.now(),
        likesCount: thread.likesCount || 0
      })

      // Limit to 100 items
      if (this.history.length > 100) {
        this.history = this.history.slice(0, 100)
      }

      this.saveToLocal()
    },

    loadFromLocal() {
      if (process.server) return
      const saved = localStorage.getItem('forum_history')
      if (saved) {
        try {
          this.history = JSON.parse(saved)
        } catch (e) {
          console.error('Failed to parse forum history', e)
          this.history = []
        }
      }
    },

    saveToLocal() {
      if (process.server) return
      localStorage.setItem('forum_history', JSON.stringify(this.history))
    },

    clearHistory() {
      this.history = []
      this.saveToLocal()
    }
  }
})
