<template>
  <div :class="['w-full', spacingClasses[spacing]]">
    <!-- SIMPLE -->
    <div v-if="variant === 'simple'" class="h-px w-full bg-black"></div>

    <!-- TACTICAL -->
    <div v-else-if="variant === 'tactical'" class="flex items-center">
      <div class="h-px flex-grow bg-black"></div>
      <div class="px-6 flex items-center space-x-2">
        <div class="w-1 h-1 bg-black rotate-45 opacity-20"></div>
        <div class="w-1.5 h-1.5 bg-black rotate-45"></div>
        <div class="w-1 h-1 bg-black rotate-45 opacity-20"></div>
      </div>
      <div class="h-px flex-grow bg-black"></div>
    </div>

    <!-- DOUBLE -->
    <div v-else class="border-t-4 border-double border-black py-1"></div>
  </div>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'simple',
    validator: (v) => ['simple', 'tactical', 'double'].includes(v)
  },
  spacing: {
    type: String,
    default: 'md',
    validator: (v) => ['none', 'sm', 'md', 'lg'].includes(v)
  }
})

const spacingClasses = {
  none: 'my-0',
  sm: 'my-4',
  md: 'my-8',
  lg: 'my-16'
}
</script>
