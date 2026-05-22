import { defineStore } from 'pinia'
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db } from '@/shared/firebase.client'
import type { Thread } from '~/entities/thread/model/thread.types'
import { useForumStore } from './useForum'

export const useSavedThreadsStore = defineStore('savedThreads', {
  state: () => ({
    savedThreadIds: [] as string[],
    loading: false,
    isLoaded: false,
    searchQuery: '',
    categoryFilter: 'all'
  }),

  getters: {
    // Get the actual thread objects from the forum store for the saved IDs
    _allSavedThreads(state) {
      const forumStore = useForumStore()
      return state.savedThreadIds
        .map(id => forumStore.threads.get(id))
        .filter(Boolean) as Thread[]
    },

    availableCategories(): string[] {
      const cats = new Set(this._allSavedThreads.map(t => t.category))
      return Array.from(cats).sort()
    },

    filteredSavedThreads(): Thread[] {
      return this._allSavedThreads
        .filter(thread => {
          const matchesSearch = thread.title.toLowerCase().includes(this.searchQuery.toLowerCase())
          const matchesCategory = this.categoryFilter === 'all' || thread.category === this.categoryFilter
          return matchesSearch && matchesCategory
        })
        .sort((a, b) => {
          const timeA = typeof a.lastActivityAt === 'number' ? a.lastActivityAt : 0
          const timeB = typeof b.lastActivityAt === 'number' ? b.lastActivityAt : 0
          return timeB - timeA
        })
    }
  },

  actions: {
    async fetchSavedThreads(userId: string) {
      if (!userId || this.isLoaded) return
      this.loading = true
      try {
        const userDoc = await getDoc(doc(db, 'users', userId))
        if (userDoc.exists()) {
          const data = userDoc.data()
          this.savedThreadIds = data.savedThreads || []
        }
        this.isLoaded = true
      } catch (error) {
        console.error('Error fetching saved threads:', error)
      } finally {
        this.loading = false
      }
    },

    async toggleSaveThread(userId: string, threadId: string) {
      if (!userId) return
      
      const isCurrentlySaved = this.savedThreadIds.includes(threadId)
      const userRef = doc(db, 'users', userId)

      try {
        if (isCurrentlySaved) {
          this.savedThreadIds = this.savedThreadIds.filter(id => id !== threadId)
          await updateDoc(userRef, {
            savedThreads: arrayRemove(threadId)
          })
        } else {
          this.savedThreadIds.push(threadId)
          await updateDoc(userRef, {
            savedThreads: arrayUnion(threadId)
          })
        }
      } catch (error) {
        // Rollback on error
        if (isCurrentlySaved) {
          this.savedThreadIds.push(threadId)
        } else {
          this.savedThreadIds = this.savedThreadIds.filter(id => id !== threadId)
        }
        console.error('Error toggling save thread:', error)
      }
    },

    isSaved(threadId: string) {
      return this.savedThreadIds.includes(threadId)
    },

    reset() {
      this.savedThreadIds = []
      this.isLoaded = false
    }
  }
})
