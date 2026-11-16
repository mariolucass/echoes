<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useSlideContext } from '@slidev/client'

// Odômetro: cada dígito é uma coluna que rola até o valor. Só dispara quando o slide é o atual.
const props = withDefaults(defineProps<{ to: number; suffix?: string; delay?: number }>(), {
  suffix: '',
  delay: 380,
})

const { $page, $slidev } = useSlideContext()
const rolling = ref(false)
let timer = 0
const digits = computed(() => String(props.to).split('').map(Number))

watch(
  () => $slidev.nav.currentPage === $page.value,
  (active) => {
    window.clearTimeout(timer)
    rolling.value = false
    if (active) timer = window.setTimeout(() => (rolling.value = true), props.delay)
  },
  { immediate: true },
)
onBeforeUnmount(() => window.clearTimeout(timer))
</script>

<template>
  <span class="odo" :aria-label="`${to}${suffix}`">
    <span v-for="(d, i) in digits" :key="i" class="odo-col" aria-hidden="true">
      <span class="odo-strip" :class="{ on: rolling }" :style="{ '--d': d, '--i': i }">
        <span v-for="n in 20" :key="n">{{ (n - 1) % 10 }}</span>
      </span>
    </span>
    <span v-if="suffix" class="odo-suffix">{{ suffix }}</span>
  </span>
</template>
