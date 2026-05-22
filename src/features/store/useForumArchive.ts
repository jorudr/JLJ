import { defineStore } from 'pinia'

export const useForumArchiveStore = defineStore('forumArchive', {
  state: () => ({
    activeTab: 'saved' as 'saved' | 'history'
  }),
  actions: {
    setActiveTab(tab: 'saved' | 'history') {
      this.activeTab = tab
    }
  }
})
