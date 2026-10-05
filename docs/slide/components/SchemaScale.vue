<script setup lang="ts">
import { computed } from 'vue'
import { useSlideContext } from '@slidev/client'

const { $clicks } = useSlideContext()
const step = computed(() => Math.min(Number($clicks.value) || 0, 4))

type Kind = '' | 'owner' | 'evo' | 'prec'
interface Row { name: string, type: string, kind?: Kind, badge?: string }
interface Card { id: string, name: string, col: number, rowPos?: 'top' | 'bottom' | 'mid', rows: Row[], delay: number, color: string }

// Clique em que cada categoria de campo passa a ser destacada.
const reachedAt: Record<Exclude<Kind, ''>, number> = { owner: 1, evo: 2, prec: 3 }

const cards: Card[] = [
  { id: 'decision', name: 'Decision', col: 1, rowPos: 'mid', delay: 0, color: '#4f8cff', rows: [
    { name: 'id', type: 'uuid', badge: 'PK' },
    { name: 'userId', type: 'uuid', kind: 'owner', badge: 'OWNER' },
    { name: 'status', type: 'enum' },
  ] },
  { id: 'revision', name: 'DecisionRevision', col: 2, rowPos: 'top', delay: 80, color: '#a86bff', rows: [
    { name: 'decisionId', type: 'uuid', kind: 'owner', badge: 'FK' },
    { name: 'snapshot', type: 'jsonb', kind: 'evo' },
    { name: '↳ schemaVersion', type: 'no JSONB', kind: 'evo' },
  ] },
  { id: 'expectation', name: 'Expectation', col: 2, rowPos: 'bottom', delay: 140, color: '#2dd4bf', rows: [
    { name: 'id', type: 'uuid', badge: 'PK' },
    { name: 'decisionId', type: 'uuid', kind: 'owner', badge: 'FK' },
    { name: 'evaluateAt', type: 'timestamptz', kind: 'prec' },
  ] },
  { id: 'metric', name: 'Metric', col: 3, rowPos: 'top', delay: 200, color: '#f5a623', rows: [
    { name: 'id', type: 'uuid', badge: 'PK' },
    { name: 'decisionId', type: 'uuid', kind: 'owner', badge: 'FK' },
    { name: 'unit', type: 'text' },
  ] },
  { id: 'target', name: 'ExpectationTarget', col: 3, rowPos: 'bottom', delay: 260, color: '#ff6b9d', rows: [
    { name: 'decisionId', type: 'uuid', kind: 'owner', badge: 'FK' },
    { name: 'targetValue', type: 'Decimal(18,4)', kind: 'prec' },
    { name: 'operator', type: 'enum' },
  ] },
  { id: 'measurement', name: 'MetricMeasurement', col: 4, rowPos: 'mid', delay: 320, color: '#38bdf8', rows: [
    { name: 'metricId', type: 'uuid', kind: 'owner', badge: 'FK' },
    { name: 'value', type: 'Decimal(18,4)', kind: 'prec' },
    { name: 'recordedAt', type: 'timestamptz', kind: 'prec' },
  ] },
]

const tabs = [
  { n: '01', label: 'ISOLAMENTO', title: 'Dono em toda chave.', at: 1 },
  { n: '02', label: 'EVOLUÇÃO', title: 'Passado versionado.', at: 2 },
  { n: '03', label: 'PRECISÃO', title: 'Global desde o dia 1.', at: 3 },
  { n: '04', label: 'CONSULTA', title: 'Índice na ordem da query.', at: 4 },
]

function rowClass(row: Row) {
  const lit = !!row.kind && reachedAt[row.kind] <= step.value
  const now = !!row.kind && reachedAt[row.kind] === step.value
  const dim = step.value >= 1 && step.value < 4 && !lit
  return [row.kind ? `kind-${row.kind}` : '', { 'is-lit': lit, 'is-now': now, 'is-dim': dim, 'is-pending-evo': row.kind === 'evo' && step.value < 2 }]
}
function cardNow(card: Card) {
  return card.rows.some(r => r.kind && reachedAt[r.kind] === step.value)
}
function tabClass(at: number) {
  return { 'is-reached': step.value >= at, 'is-now': step.value === at }
}
</script>

<template>
  <div class="schema-scale" :data-step="step">
    <!-- Grid com as 4 colunas de modelos -->
    <div class="schema-grid">
      <!-- Coluna 1: Decision -->
      <div class="grid-col grid-col--mid">
        <div
          v-for="card in cards.filter(c => c.col === 1)"
          :key="card.id"
          class="card"
          :class="[`card--${card.id}`, { 'is-now': cardNow(card), 'is-dim-card': step >= 1 && step < 4 && !cardNow(card) }]"
          :style="{ '--delay': `${card.delay}ms`, '--c': card.color }"
        >
          <div class="card-head">
            <span class="card-glyph" aria-hidden="true" />
            <span class="card-name">{{ card.name }}</span>
          </div>
          <div class="card-body">
            <div v-for="row in card.rows" :key="row.name" class="row" :class="rowClass(row)">
              <span class="row-name">{{ row.name }}</span>
              <span v-if="row.badge" class="row-badge" :class="{ 'row-badge--owner': row.badge === 'OWNER' }">{{ row.badge }}</span>
              <span class="row-type">{{ row.type }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Coluna 2: DecisionRevision (topo) e Expectation (base) -->
      <div class="grid-col grid-col--stack">
        <div
          v-for="card in cards.filter(c => c.col === 2)"
          :key="card.id"
          class="card"
          :class="[`card--${card.id}`, { 'is-now': cardNow(card), 'is-dim-card': step >= 1 && step < 4 && !cardNow(card) }]"
          :style="{ '--delay': `${card.delay}ms`, '--c': card.color }"
        >
          <div class="card-head">
            <span class="card-glyph" aria-hidden="true" />
            <span class="card-name">{{ card.name }}</span>
          </div>
          <div class="card-body">
            <div v-for="row in card.rows" :key="row.name" class="row" :class="rowClass(row)">
              <span class="row-name">{{ row.name }}</span>
              <span v-if="row.badge" class="row-badge" :class="{ 'row-badge--owner': row.badge === 'OWNER' }">{{ row.badge }}</span>
              <span class="row-type">{{ row.type }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Coluna 3: Metric (topo) e ExpectationTarget (base) -->
      <div class="grid-col grid-col--stack">
        <div
          v-for="card in cards.filter(c => c.col === 3)"
          :key="card.id"
          class="card"
          :class="[`card--${card.id}`, { 'is-now': cardNow(card), 'is-dim-card': step >= 1 && step < 4 && !cardNow(card) }]"
          :style="{ '--delay': `${card.delay}ms`, '--c': card.color }"
        >
          <div class="card-head">
            <span class="card-glyph" aria-hidden="true" />
            <span class="card-name">{{ card.name }}</span>
          </div>
          <div class="card-body">
            <div v-for="row in card.rows" :key="row.name" class="row" :class="rowClass(row)">
              <span class="row-name">{{ row.name }}</span>
              <span v-if="row.badge" class="row-badge" :class="{ 'row-badge--owner': row.badge === 'OWNER' }">{{ row.badge }}</span>
              <span class="row-type">{{ row.type }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Coluna 4: MetricMeasurement -->
      <div class="grid-col grid-col--mid">
        <div
          v-for="card in cards.filter(c => c.col === 4)"
          :key="card.id"
          class="card"
          :class="[`card--${card.id}`, { 'is-now': cardNow(card), 'is-dim-card': step >= 1 && step < 4 && !cardNow(card) }]"
          :style="{ '--delay': `${card.delay}ms`, '--c': card.color }"
        >
          <div class="card-head">
            <span class="card-glyph" aria-hidden="true" />
            <span class="card-name">{{ card.name }}</span>
          </div>
          <div class="card-body">
            <div v-for="row in card.rows" :key="row.name" class="row" :class="rowClass(row)">
              <span class="row-name">{{ row.name }}</span>
              <span v-if="row.badge" class="row-badge" :class="{ 'row-badge--owner': row.badge === 'OWNER' }">{{ row.badge }}</span>
              <span class="row-type">{{ row.type }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Abas inferiores -->
    <div class="tabs">
      <div v-for="t in tabs" :key="t.n" class="tab" :class="tabClass(t.at)">
        <div class="tab-track"><span class="tab-fill" /></div>
        <div class="tab-label"><b>{{ t.n }}</b> {{ t.label }}</div>
        <h3>{{ t.title }}</h3>
        <p v-if="t.n === '01'"><code>userId</code> na decisão, <code>decisionId</code> nas relações: base multitenant.</p>
        <p v-else-if="t.n === '02'">Snapshot JSONB com <code>schemaVersion</code> sem reescrever o histórico.</p>
        <p v-else-if="t.n === '03'"><code>Decimal(18,4)</code> nos valores e <code>timestamptz</code> nas datas.</p>
        <p v-else><code>(userId, deletedAt, createdAt, id)</code> com desempate por <code>id</code>.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.schema-scale {
  --ease: cubic-bezier(.2, .8, .2, 1);
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-top: -6px;
}

.schema-grid {
  display: grid;
  grid-template-columns: 0.95fr 1.25fr 1.2fr 1.3fr;
  gap: 12px;
  align-items: stretch;
}

.grid-col {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.grid-col--mid {
  justify-content: center;
}
.grid-col--stack {
  gap: 8px;
  justify-content: space-between;
}

@keyframes rise {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

.card {
  position: relative;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
  --c: var(--accent-from);
  border: 1px solid color-mix(in srgb, var(--c) 28%, var(--border-strong));
  border-radius: 10px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--c) 7%, transparent), transparent 60%), var(--bg-elevated);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .05);
  opacity: 0;
  animation: rise 480ms var(--ease) forwards;
  animation-delay: var(--delay);
  transition: border-color 450ms var(--ease), box-shadow 450ms var(--ease), filter 450ms var(--ease);
}
.card.is-dim-card { filter: brightness(.7); }
.card.is-now {
  border-color: color-mix(in srgb, var(--accent-from) 55%, transparent);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .06), 0 0 20px color-mix(in srgb, var(--accent-from) 16%, transparent);
}

.card-head {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 28px;
  padding: 0 10px;
  border-bottom: 1px solid var(--border);
  position: relative;
}
.card-head::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--c);
  opacity: 0.9;
}
.card-glyph {
  width: 9px;
  height: 9px;
  border: 1.5px solid var(--c);
  border-radius: 2px;
  background: linear-gradient(var(--c), var(--c)) 0 1.5px / 100% 1.5px no-repeat;
}
.card-name {
  color: var(--fg);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -.02em;
  white-space: nowrap;
}

.card-body {
  display: flex;
  flex-direction: column;
  padding: 1px 0 3px;
}

.row {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 21px;
  padding: 0 10px;
  color: var(--muted);
  font: 500 12px/1 var(--conference-font-mono, "Geist Mono Variable", monospace);
  white-space: nowrap;
  transition: background-color 400ms var(--ease), color 400ms var(--ease), opacity 400ms var(--ease);
}
.row-name { color: inherit; }
.row-type { margin-left: auto; color: var(--subtle); font-size: 11px; transition: color 400ms var(--ease); }
.row-badge {
  padding: 1px 3px;
  border: 1px solid var(--border-strong);
  border-radius: 3px;
  color: var(--subtle);
  font-size: 8.5px;
  font-weight: 600;
  letter-spacing: .05em;
}
.row-badge--owner {
  border-color: color-mix(in srgb, var(--accent-from) 60%, transparent);
  color: var(--accent-from);
}

.row.is-dim { opacity: .42; }
.row.is-pending-evo { opacity: .65; }
.row.is-lit { color: var(--fg); }
.row.is-lit .row-type { color: var(--muted); }
.row.kind-owner.is-lit { background: color-mix(in srgb, var(--accent-from) 11%, transparent); }
.row.kind-evo.is-lit { background: color-mix(in srgb, var(--accent-to) 13%, transparent); }
.row.kind-prec.is-lit { background: color-mix(in srgb, var(--success) 11%, transparent); }
.row.is-now { background-color: color-mix(in srgb, var(--accent-from) 20%, transparent); }
.row.kind-evo.is-now { background-color: color-mix(in srgb, var(--accent-to) 24%, transparent); }
.row.kind-prec.is-now { background-color: color-mix(in srgb, var(--success) 20%, transparent); }

.tabs {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-top: 12px;
}
.tab { min-width: 0; opacity: .38; transition: opacity 450ms var(--ease); }
.tab.is-reached { opacity: .66; }
.tab.is-now { opacity: 1; }
.tab-track { position: relative; height: 2px; overflow: hidden; border-radius: 2px; background: var(--border-strong); }
.tab-fill {
  position: absolute;
  inset: 0;
  background: var(--accent);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 600ms var(--ease);
}
.tab.is-reached .tab-fill { transform: scaleX(1); }
.tab-label {
  margin-top: 7px;
  color: var(--subtle);
  font: 600 10.5px/1.2 var(--conference-font-mono, monospace);
  letter-spacing: .1em;
  transition: color 400ms var(--ease);
}
.tab-label b { color: var(--accent-from); font-weight: 600; }
.tab.is-now .tab-label { color: var(--fg); }
.tab h3 { margin-top: 3px; color: var(--fg); font-size: 17px; font-weight: 600; line-height: 1.15; letter-spacing: -.02em; }
.tab p { margin-top: 3px; color: var(--muted); font-size: 13.5px; line-height: 1.25; }
.tab code {
  display: inline-block;
  padding: .01em .2em;
  border: 1px solid var(--border-strong);
  border-radius: 3px;
  background: var(--bg-elevated);
  color: var(--fg);
  font-family: var(--conference-font-mono, monospace);
  font-size: .8em;
}

@media print, (prefers-reduced-motion: reduce) {
  .card { animation: none; opacity: 1; }
  .card, .row, .row-type, .tab, .tab-fill, .tab-label { transition: none; }
}
</style>
