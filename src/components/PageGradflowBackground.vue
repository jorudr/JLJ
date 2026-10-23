<template>
  <div class="page-gradflow" aria-hidden="true">
    <GradflowBackground preset="mystic" :config="gradflowConfig" />
  </div>
</template>

<script setup>
import GradflowBackground from './GradflowBackground.vue'
import { gradflowConfig } from '../shared/gradflowConfig'
</script>

<style scoped>
/* Full-viewport gradflow that stays in place while the page content scrolls over it. */
.page-gradflow {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

/* Same as the home hero: keep a landscape render surface on portrait screens so the gradient isn't stretched. */
@media (max-width: 767px) {
  .page-gradflow :deep(.gradflow-canvas) {
    right: auto;
    left: 50%;
    width: max(100%, 248.8889vh);
    width: max(100%, 248.8889dvh);
    transform: translateX(-50%);
  }
}
</style>
