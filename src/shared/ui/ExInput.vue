<template>
  <div class="flex flex-col space-y-2">
    <span v-if="label" class="text-[8px] font-mono opacity-30 uppercase tracking-[0.5em] text-nier-text-light dark:text-nier-text-dark">{{ label }}</span>
    
    <!-- STANDARD VARIANT -->
    <div v-if="variant === 'standard'" class="relative group">
      <ExGothicCorners variant="light" :opacity="0.3" class="group-focus-within:opacity-80 transition-opacity duration-500" />
      <span v-if="prefix" class="absolute left-0 top-1/2 -translate-y-1/2 text-[9px] font-mono opacity-30 group-focus-within:opacity-100 transition-opacity uppercase tracking-widest px-4 text-nier-text-light dark:text-nier-text-dark">
        {{ prefix }}
      </span>
      <input 
        v-bind="$attrs"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        :placeholder="placeholder"
        class="w-full h-[34px] bg-nier-white dark:bg-nier-black border border-nier-border-light dark:border-nier-border-dark py-2 pr-4 text-[11px] font-mono tracking-widest focus:outline-none focus:border-nier-text-light dark:focus:border-nier-text-dark transition-all text-nier-text-light dark:text-nier-text-dark placeholder:opacity-20 uppercase"
        :class="prefix ? 'pl-24' : 'pl-4'"
      />
    </div>

    <!-- TERMINAL VARIANT -->
    <div v-else class="relative group border-b border-nier-border-light dark:border-nier-border-dark focus-within:border-nier-text-light dark:focus-within:border-nier-text-dark transition-colors duration-500">
      <input 
        v-bind="$attrs"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        :placeholder="placeholder"
        class="w-full h-[34px] bg-transparent py-2 px-2 text-[11px] font-mono tracking-[0.4em] focus:outline-none text-nier-text-light dark:text-nier-text-dark placeholder:opacity-20 uppercase"
      />
      <div class="absolute bottom-0 left-0 w-0 h-0.5 bg-nier-text-light dark:bg-nier-text-dark group-focus-within:w-full transition-all duration-700 ease-[var(--nier-ease)]"></div>
    </div>
  </div>
</template>

<script setup>
import ExGothicCorners from './ExGothicCorners.vue'

defineOptions({
  inheritAttrs: false
})
defineProps({
  modelValue: [String, Number],
  label: String,
  prefix: String,
  placeholder: String,
  variant: {
    type: String,
    default: 'standard',
    validator: (v) => ['standard', 'terminal'].includes(v)
  }
})

defineEmits(['update:modelValue'])
</script>
