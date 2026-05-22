import { ref, computed } from 'vue'

export const collapsed = ref({
  project: false,
  theory: false,
  practice: false,
})

export function toggle(key: string) {
  collapsed.value[key as keyof typeof collapsed.value] = !collapsed.value[key as keyof typeof collapsed.value]
}

import { mainSections, categories } from '~/entities/thread/model/thread.constants'

export const definedCategory = computed(() => (categoryId: string) => {
  if (categoryId === '') {
    return {
      title: 'Project: Key to the Market',
      description: 'A collective attempt to identify durable principles of successful trading across markets, timeframes and regimes.',
      idea: `This section is not about signals or predictions.
             Each thread contributes either a theoretical assumption
             or a practical test.
             Over time, contradictions are resolved or exposed.`
    }
  }

  // Search all categories in all sections for a matching ID
  for (const sectionId in categories) {
    const sectionList = categories[sectionId as keyof typeof categories]
    if (!sectionList) continue
    
    const topic = sectionList.find(c => c.id === categoryId)
    if (topic) {
      return {
        title: topic.name,
        description: topic.desc,
        idea: ''
      }
    }
  }

  // Fallback to section check if it's a domain ID
  const section = mainSections.find(s => s.id === categoryId)
  if (section) {
    return {
      title: section.name,
      description: section.desc,
      idea: ''
    }
  }

  return {
    title: categoryId ? (categoryId.charAt(0).toUpperCase() + categoryId.slice(1)) : 'General',
    description: '',
    idea: ''
  }
})