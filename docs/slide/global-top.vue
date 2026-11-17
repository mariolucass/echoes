<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useNav } from '@slidev/client'

// Camadas de acabamento do deck N2: vinheta, grão de filme, foco de luz e progresso.
const { currentPage, total } = useNav()
const enabled = typeof document !== 'undefined' && document.documentElement.dataset.deck === 'n2'
const scale = computed(() => (total.value ? currentPage.value / total.value : 0))

function move(e: PointerEvent) {
  const root = document.querySelector<HTMLElement>('.deck-fx')
  if (!root) return
  const r = root.getBoundingClientRect()
  root.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`)
  root.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`)
}
onMounted(() => enabled && window.addEventListener('pointermove', move, { passive: true }))
onBeforeUnmount(() => window.removeEventListener('pointermove', move))
</script>

<template>
  <div v-if="enabled" class="deck-fx" aria-hidden="true">
    <div class="vignette" />
    <div class="spot" />
    <div class="grain" />
    <div class="progress" :style="{ transform: `scaleX(${scale})` }" />
  </div>
</template>
