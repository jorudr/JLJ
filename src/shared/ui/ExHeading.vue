<template>
  <component 
    :is="level"
    :class="[
      'uppercase transition-colors duration-500',
      variantClasses[variant]
    ]"
  >
    <slot></slot>
  </component>
</template>

<script setup>
defineProps({
  level: {
    type: String,
    default: 'h1',
    validator: (v) => ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(v)
  },
  variant: {
    type: String,
    default: 'technical',
    validator: (v) => ['cinematic', 'technical', 'module'].includes(v)
  }
})

const variantClasses = {
  // Nier Style: Serif, Light, wide tracking, relaxed leading
  cinematic: 'text-6xl font-light font-serif tracking-[0.4em] drop-shadow-sm leading-relaxed',
  // Technical Style: Mono, Black, medium tracking
  technical: 'text-2xl font-mono font-black tracking-[0.2em]',
  // Module Style: Small mono header
  module: 'text-sm font-mono tracking-[0.4em] opacity-60'
}
</script>
