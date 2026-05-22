import { computed } from "vue";
import type { Thread } from "~/entities/thread/model/thread.types";
import { normalizeDate } from "~/composables/normalizeDate";

export function useMainForum(threads: Thread[]) {
  const recentThreads = computed(() => {
    return [...threads]
      .sort(
        (a, b) =>
          normalizeDate(b.createdAt).getTime() -
          normalizeDate(a.createdAt).getTime()
      )
      .slice(0, 6)
  })

  return { recentThreads }
}

