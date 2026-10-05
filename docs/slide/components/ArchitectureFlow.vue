<script setup lang="ts">
import { computed } from 'vue'
import { useSlideContext } from '@slidev/client'

const { $clicks } = useSlideContext()
const step = computed(() => Math.min(Number($clicks.value) || 0, 3))

interface NodeItem {
  id: string
  n: string
  title: string
  desc: string
  path: string
  at: number
  d: number
  event?: string
}

const reqNodes: NodeItem[] = [
  { id: 'hono', n: '01', title: 'Hono + Zod', desc: 'Recebe a requisição e valida o contrato', path: 'src/routes · src/schemas', at: 1, d: 0 },
  { id: 'controllers', n: '02', title: 'Controllers + Services', desc: 'Orquestram o caso de uso e publicam eventos', path: 'src/controllers · src/services', at: 1, d: 160, event: '↗ evento pós-commit' },
  { id: 'repos', n: '03', title: 'Repositories + Prisma 7', desc: 'Consultas, bloqueios e transações', path: 'src/repositories', at: 1, d: 320 },
]

const resNodes: NodeItem[] = [
  { id: 'response', n: '→', title: 'Resposta JSON', desc: 'O mesmo formato, a cada versão', path: 'cliente', at: 3, d: 480 },
  { id: 'transformers', n: '05', title: 'Transformers', desc: 'Contrato HTTP estável', path: 'src/transformers', at: 3, d: 320 },
  { id: 'projections', n: '04', title: 'Projections', desc: 'Campos exatos para o contrato', path: 'src/projections', at: 3, d: 160 },
]
</script>

<template>
  <div class="arch" :data-step="step">
    <div class="columns-grid">
      <!-- Coluna da Requisição (descida) -->
      <div class="col col--down">
        <div class="lane-label">REQUISIÇÃO ↓</div>
        <div class="cards-list">
          <div
            v-for="node in reqNodes"
            :key="node.id"
            class="node node--down"
            :class="{ 'is-lit': step >= node.at, 'is-now': step === node.at }"
            :style="{ '--d': `${node.d}ms` }"
          >
            <span class="node-n">{{ node.n }}</span>
            <div class="node-body">
              <div class="node-head">
                <span class="node-title">{{ node.title }}</span>
                <span v-if="node.event" class="event-badge" :class="{ 'is-on': step >= 2 }">{{ node.event }}</span>
              </div>
              <div class="node-desc">{{ node.desc }}</div>
            </div>
            <span class="node-path">{{ node.path }}</span>
          </div>
        </div>
      </div>

      <!-- Coluna da Resposta (subida) -->
      <div class="col col--up">
        <div class="lane-label">↑ RESPOSTA</div>
        <div class="cards-list">
          <div
            v-for="node in resNodes"
            :key="node.id"
            class="node node--up"
            :class="{ 'is-lit': step >= node.at, 'is-now': step === node.at }"
            :style="{ '--d': `${node.d}ms` }"
          >
            <span class="node-n">{{ node.n }}</span>
            <div class="node-body">
              <div class="node-head">
                <span class="node-title">{{ node.title }}</span>
              </div>
              <div class="node-desc">{{ node.desc }}</div>
            </div>
            <span class="node-path">{{ node.path }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Base do Banco PostgreSQL -->
    <div class="db-card" :class="{ 'is-lit': step >= 1, 'is-now': step === 1 }" style="--d: 480ms">
      <span class="node-n">DB</span>
      <div class="node-body">
        <span class="node-title">PostgreSQL</span>
        <span class="node-desc">Relações, constraints e trigger de imutabilidade</span>
      </div>
      <span class="node-path">prisma/domains · migrations</span>
    </div>

    <!-- Stack Footer -->
    <div class="stack" :class="{ 'is-on': step >= 3 }">
      <span class="chip">TypeScript ponta a ponta</span>
      <span class="chip">Node.js 22+</span>
      <span class="chip">Docker</span>
      <span class="badge">MONÓLITO MODULAR · CAMADAS E DOMÍNIOS</span>
    </div>
  </div>
</template>

<style scoped>
.arch {
  --ease: cubic-bezier(.2, .8, .2, 1);
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-top: 10px;
}
.mono, .lane-label, .node-n, .node-path, .event-badge, .chip, .badge {
  font-family: var(--conference-font-mono, "Geist Mono Variable", monospace);
}

.columns-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
}

.col {
  display: flex;
  flex-direction: column;
}

.lane-label {
  margin-bottom: 10px;
  color: var(--subtle);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: .12em;
}

.cards-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.node, .db-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 62px;
  padding: 10px 20px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(255, 255, 255, .035), transparent 60%), var(--bg-elevated);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .04);
  opacity: .5;
  transition: opacity 600ms var(--ease) var(--d, 0ms), border-color 600ms var(--ease) var(--d, 0ms), box-shadow 600ms var(--ease) var(--d, 0ms);
}

.db-card {
  margin-top: 12px;
  background: linear-gradient(180deg, rgba(255, 255, 255, .06), rgba(255, 255, 255, .015)), var(--bg-elevated);
}

.is-lit { opacity: 1; }
.node--down.is-lit { border-color: color-mix(in srgb, var(--accent-from) 42%, transparent); }
.node--up.is-lit { border-color: color-mix(in srgb, var(--accent-to) 44%, transparent); }
.db-card.is-lit { border-color: var(--border-strong); }

.node--down.is-now {
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .05), 0 0 24px color-mix(in srgb, var(--accent-from) 20%, transparent);
}
.node--up.is-now {
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .05), 0 0 24px color-mix(in srgb, var(--accent-to) 22%, transparent);
}
.db-card.is-now {
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .06), 0 0 28px color-mix(in srgb, var(--accent-from) 18%, transparent);
}

.node-n {
  flex: 0 0 30px;
  color: var(--subtle);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: .04em;
  transition: color 600ms var(--ease) var(--d, 0ms);
}
.node--down.is-lit .node-n, .db-card.is-lit .node-n { color: var(--accent-from); }
.node--up.is-lit .node-n { color: var(--accent-to); }

.node-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.node-head {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.node-title {
  color: var(--fg);
  font-size: 19px;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -.02em;
}

.node-desc {
  margin-top: 3px;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.25;
}

.db-card .node-body {
  flex-direction: row;
  align-items: baseline;
  gap: 14px;
}
.db-card .node-desc {
  margin-top: 0;
}

.node-path {
  flex: 0 0 auto;
  color: var(--subtle);
  font-size: 12px;
  letter-spacing: .02em;
  white-space: nowrap;
}

.event-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border: 1px dashed color-mix(in srgb, var(--accent-from) 65%, transparent);
  border-radius: 5px;
  background: color-mix(in srgb, var(--accent-from) 12%, var(--bg-elevated));
  color: var(--accent-from);
  font-size: 11px;
  font-weight: 600;
  opacity: 0;
  transform: translateY(2px);
  transition: opacity 500ms var(--ease), transform 500ms var(--ease);
}
.event-badge.is-on {
  opacity: 1;
  transform: translateY(0);
}

.stack {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
  opacity: .55;
  transition: opacity 600ms var(--ease);
}
.stack.is-on { opacity: 1; }
.chip {
  padding: 6px 14px;
  border: 1px solid var(--border-strong);
  border-radius: 999px;
  background: rgba(10, 10, 10, .7);
  color: var(--muted);
  font-size: 13px;
  font-weight: 500;
}
.badge {
  margin-left: auto;
  color: var(--subtle);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: .12em;
}

@media print, (prefers-reduced-motion: reduce) {
  .node, .db-card, .event-badge, .stack, .node-n { transition: none; }
}
</style>
