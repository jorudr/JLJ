import { defineStore } from 'pinia'
import { mainSections, categories } from '~/entities/thread/model/thread.constants'
import type { Section } from '~/entities/thread/model/thread.constants'

export type { Section }

export const useForumCategoryStore = defineStore('forumCategory', {
  state: () => ({
    mainSections,
    categories,
    activeCategoryId: null as string | null,
    activeSectionId: null as string | null,
  }),

  getters: {
    getCategoriesBySection: (state) => (sectionId: string) => {
      return state.categories[sectionId] ?? []
    },
  },
})
