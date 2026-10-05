<script setup lang="ts">
interface AudienceCol {
  n: string
  key: string
  title: string
  titleLines?: string[]
  color: string
}

const columns: AudienceCol[] = [
  {
    n: '01',
    key: 'Engenharia',
    title: 'Decisões técnicas, com resultado.',
    color: '#4C7DFF',
  },
  {
    n: '02',
    key: 'Produto',
    title: 'Apostas com métrica.',
    color: '#4C7DFF',
  },
  {
    n: '03',
    key: 'Liderança',
    title: 'Um portfólio de decisões.',
    color: '#4C7DFF',
  },
  {
    n: '04',
    key: 'Pessoas',
    title: 'Decisões de vida.',
    titleLines: ['Decisões', 'de vida.'],
    color: '#F5B16B',
  },
]
</script>

<template>
  <div class="audience-grid">
    <div
      v-for="col in columns"
      :key="col.key"
      class="audience-col"
      :style="{ '--accent-col': col.color }"
    >
      <!-- Hairline superior com traço de acento de 24x2px -->
      <div class="col-hairline">
        <span class="accent-bar" />
      </div>

      <!-- Header: Número mono e Tag da coluna -->
      <div class="col-header">
        <span class="col-num">{{ col.n }}</span>
        <span class="col-key">{{ col.key }}</span>
      </div>

      <!-- Ícone SVG de 56px perfeitamente alinhado na coordenada x = 0 da coluna -->
      <div class="icon-container">
        <!-- 01 Engenharia -->
        <svg
          v-if="col.n === '01'"
          class="eco-icon"
          viewBox="0 0 56 56"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
        >
          <circle cx="12" cy="28" r="8" opacity=".7" />
          <circle cx="20" cy="28" r="16" opacity=".45" />
          <circle cx="28" cy="28" r="24" opacity=".25" />
          <circle cx="4" cy="28" r="3" fill="#4C7DFF" stroke="none" />
        </svg>

        <!-- 02 Produto -->
        <svg
          v-else-if="col.n === '02'"
          class="eco-icon"
          viewBox="0 0 56 56"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
        >
          <circle cx="28" cy="28" r="8" opacity=".6" />
          <circle cx="28" cy="28" r="16" opacity=".35" />
          <circle cx="28" cy="28" r="24" opacity=".2" />
          <circle cx="39.3" cy="16.7" r="3" fill="#4C7DFF" stroke="none" />
        </svg>

        <!-- 03 Liderança -->
        <svg
          v-else-if="col.n === '03'"
          class="eco-icon"
          viewBox="0 0 56 56"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
        >
          <circle cx="16" cy="28" r="14" opacity=".25" />
          <circle cx="40" cy="28" r="14" opacity=".25" />
          <circle cx="28" cy="28" r="14" opacity=".6" />
          <circle cx="28" cy="28" r="3" fill="#4C7DFF" stroke="none" />
        </svg>

        <!-- 04 Pessoas -->
        <svg
          v-else-if="col.n === '04'"
          class="eco-icon"
          viewBox="0 0 56 56"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
        >
          <circle cx="28" cy="28" r="9" opacity=".6" />
          <circle cx="28" cy="28" r="17" opacity=".35" stroke-dasharray="2 5" />
          <circle cx="28" cy="28" r="25" opacity=".2" stroke-dasharray="2 6" />
          <circle cx="28" cy="28" r="3" fill="#F5B16B" stroke="none" />
        </svg>
      </div>

      <!-- Título de até ~4 palavras com alinhamento rigoroso -->
      <h3 class="col-title">
        <template v-if="col.titleLines">
          <span v-for="(line, idx) in col.titleLines" :key="idx" class="title-line">{{ line }}</span>
        </template>
        <template v-else>
          {{ col.title }}
        </template>
      </h3>
    </div>
  </div>
</template>

<style scoped>
.audience-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
  width: 100%;
  margin-top: 36px;
  position: relative;
}

.audience-col {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 0 32px;
}

.audience-col:first-child {
  padding-left: 0;
}

.audience-col:last-child {
  padding-right: 0;
}

/* Divisores verticais com fade suave nas pontas */
.audience-col + .audience-col::before {
  content: "";
  position: absolute;
  left: 0;
  top: 10px;
  bottom: 10px;
  width: 1px;
  background: linear-gradient(
    180deg,
    transparent 0%,
    var(--border-strong) 25%,
    var(--border-strong) 75%,
    transparent 100%
  );
}

/* Hairline superior com traço de acento de 24px × 2px */
.col-hairline {
  position: relative;
  width: 100%;
  height: 2px;
  background: var(--border);
  margin-bottom: 24px;
}

.accent-bar {
  position: absolute;
  top: 0;
  left: 0;
  width: 24px;
  height: 2px;
  background: var(--accent-col);
  border-radius: 1px;
}

/* Cabeçalho */
.col-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
}

.col-num {
  color: var(--subtle);
  font: 600 13px var(--conference-font-mono, "Geist Mono Variable", monospace);
  letter-spacing: 0.1em;
}

.col-key {
  color: var(--muted);
  font: 500 14px var(--conference-font-mono, "Geist Mono Variable", monospace);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

/* Container do Ícone: alinhamento estrito em x = 0 (mesma margem esquerda do texto) */
.icon-container {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  height: 56px;
  margin-bottom: 24px;
  padding: 0;
}

.eco-icon {
  width: 56px;
  height: 56px;
  margin-left: 0;
  color: rgba(255, 255, 255, 0.9);
  display: block;
}

/* Tipografia */
.col-title {
  margin: 0;
  color: var(--fg);
  font-size: 26px;
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.025em;
  text-wrap: balance;
  min-height: 66px;
}

.title-line {
  display: block;
}
</style>
