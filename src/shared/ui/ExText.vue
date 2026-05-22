<template>
  <p 
    :class="[
      'font-mono transition-colors duration-500',
      variantClasses[variant]
    ]"
  >
    <slot></slot>
  </p>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'body',
    validator: (v) => ['body', 'telemetry', 'small'].includes(v)
  }
})

const variantClasses = {
  // Body text for descriptions and narratives
  body: 'text-sm leading-relaxed opacity-70',
  // High-density system telemetry
  telemetry: 'text-[9px] font-black uppercase tracking-[0.4em] opacity-40',
  // Tiny metadata
  small: 'text-[8px] uppercase tracking-[0.3em] opacity-30'
}
</script>
