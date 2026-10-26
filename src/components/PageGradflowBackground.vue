<template>
  <div class="page-gradflow" aria-hidden="true"></div>
</template>

<style scoped>
/*
 * Static snapshot of the home gradflow (same config), rendered once to
 * public/assets/gradflow-bg.jpg. Stays in place while the page content scrolls over it.
 */
.page-gradflow {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: #000 url('/assets/gradflow-bg.jpg') center / cover no-repeat;
}
</style>
