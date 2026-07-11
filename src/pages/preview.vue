<template>
  <main class="exgenesis-preview" aria-label="ExGenesis dashboard preview">
    <section class="exgenesis-preview__stage">
      <div class="exgenesis-preview__mark" aria-hidden="true">
        <div class="exgenesis-preview__ring exgenesis-preview__ring--outer" />
        <div class="exgenesis-preview__ring exgenesis-preview__ring--inner" />
        <div class="exgenesis-preview__core" />
        <div class="exgenesis-preview__corner exgenesis-preview__corner--tl" />
        <div class="exgenesis-preview__corner exgenesis-preview__corner--br" />
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
definePageMeta({
  hideChrome: true,
})
</script>

<style scoped>
.exgenesis-preview {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 100vh;
  overflow: hidden;
  --theme-bg: #000000;
  --theme-text: #f9f6f0;
  --theme-grid-dot: rgba(249, 246, 240, 0.16);
  --text-primary: rgba(255, 255, 255, 0.5);
  background: #000;
  color: #f9f6f0;
}

.exgenesis-preview__stage {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
}

.exgenesis-preview__mark {
  position: relative;
  display: grid;
  place-items: center;
  width: min(19vw, 360px);
  aspect-ratio: 1;
  color: currentColor;
  filter: drop-shadow(0 0 36px rgba(249, 246, 240, 0.14));
}

.exgenesis-preview__ring,
.exgenesis-preview__corner,
.exgenesis-preview__core {
  position: absolute;
}

.exgenesis-preview__ring--outer {
  inset: 0;
  border: 12px solid rgba(249, 246, 240, 0.42);
  animation: preview-spin 10s linear infinite;
}

.exgenesis-preview__ring--inner {
  inset: 30%;
  border: 5px solid rgba(249, 246, 240, 0.66);
  animation: preview-spin-reverse 6s linear infinite;
}

.exgenesis-preview__core {
  width: 13%;
  aspect-ratio: 1;
  background: currentColor;
  transform: rotate(45deg);
  animation: preview-pulse 1.9s ease-in-out infinite;
}

.exgenesis-preview__corner {
  width: 23%;
  height: 23%;
}

.exgenesis-preview__corner--tl {
  left: -12%;
  top: -12%;
  background:
    linear-gradient(currentColor, currentColor) left top / 100% 10px no-repeat,
    linear-gradient(currentColor, currentColor) left top / 10px 100% no-repeat;
}

.exgenesis-preview__corner--br {
  right: -12%;
  bottom: -12%;
  background:
    linear-gradient(currentColor, currentColor) right bottom / 100% 10px no-repeat,
    linear-gradient(currentColor, currentColor) right bottom / 10px 100% no-repeat;
}

@keyframes preview-pulse {
  0%, 100% { opacity: 0.7; transform: rotate(45deg) scale(0.9); }
  50% { opacity: 1; transform: rotate(45deg) scale(1.12); }
}

@keyframes preview-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes preview-spin-reverse {
  from { transform: rotate(0deg); }
  to { transform: rotate(-360deg); }
}
</style>
