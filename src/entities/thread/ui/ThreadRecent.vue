<template>
  <NuxtLink :to="`/forum/thread/${thread.id}`">
  <div class="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-4 mb-2">
          <div>
            <div class="text-sm font-serif">
              {{ thread.title }}
            </div>
            <div class="text-xs text-[#666] dark:text-[#aaa] font-serif ">
              {{ capitalize(thread.category) }}: {{ capitalize(thread.subcategory) }}
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-1 text-rose-500/60 text-[10px] mr-2">
              <svg class="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              <span>{{ thread.likesCount || 0 }}</span>
            </div>
            <div class="text-xs text-[#999]">{{ timeAgo(thread.createdAt) }}</div>
          </div>
      </div>
    </NuxtLink>
</template>

<script setup lang="ts">
import type { Thread } from "~/entities/thread/model/thread.types";
import { timeAgo } from "~/composables/timeAgo";
import { capitalize } from "~/shared/capitalise";

interface Props {
  thread: Thread;
}

const props = defineProps<Props>();
</script>
