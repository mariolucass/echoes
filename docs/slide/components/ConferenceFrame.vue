<script setup lang="ts">
import { computed } from 'vue'
import { useSlideContext } from '@slidev/client'

const props = withDefaults(defineProps<{ variant?: string; eyebrow?: string }>(), {
  variant: 'default',
  eyebrow: '',
})

const { $slidev, $frontmatter, $page } = useSlideContext()
const pageLabel = computed(() => String($page.value).padStart(2, '0'))
const total = computed(() => String($slidev.nav.total).padStart(2, '0'))
const showFooter = computed(() => !['cover', 'statement', 'end'].includes(props.variant) && $frontmatter.footer !== false)
const fontStyles = computed(() => ({
  '--conference-font-sans': $slidev.configs.fonts.sans.join(', '),
  '--conference-font-mono': $slidev.configs.fonts.mono.join(', '),
}))
</script>

<template>
  <div class="slidev-layout conference" :class="[`conference--${variant}`, { 'grid-bg': $frontmatter.class === 'grid-bg' }]" :style="fontStyles">
    <div v-if="eyebrow || $frontmatter.eyebrow" class="conference-eyebrow">{{ eyebrow || $frontmatter.eyebrow }}</div>
    <main class="conference-content"><slot /></main>
    <footer v-if="showFooter" class="conference-footer">
      <span>ECHOES</span>
      <span>{{ pageLabel }} / {{ total }}</span>
    </footer>
  </div>
</template>
