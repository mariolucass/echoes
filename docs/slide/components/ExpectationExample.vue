<script setup lang="ts">
import { computed } from 'vue'
import { useSlideContext } from '@slidev/client'

const { $clicks } = useSlideContext()
const activeStep = computed(() => $clicks.value >= 2 && $clicks.value <= 5 ? $clicks.value - 1 : 0)

function lineState(step: number) {
  return {
    'is-dimmed': activeStep.value !== 0 && activeStep.value !== step,
    'is-active': step !== 0 && activeStep.value === step,
  }
}
</script>

<template>
  <div class="expectation-example">
    <div class="expectation-card glow" :class="{ 'is-visible': $clicks >= 1 }">
      <div class="expectation-endpoint">
        <span class="expectation-method">POST</span>
        <span>/decisions/:id/expectations</span>
      </div>

      <div class="expectation-json" aria-label="Exemplo de expectativa em JSON">
        <div class="json-line" :class="lineState(0)"><span class="json-marker" /><code class="json-content">{</code></div>
        <div class="json-line" :class="lineState(0)"><span class="json-marker" /><code class="json-content json-indent-1"><span class="json-neutral">"description": "Gerar o relatório em até 5 s",</span></code></div>
        <div class="json-line" :class="lineState(0)"><span class="json-marker" /><code class="json-content json-indent-1"><span class="json-neutral">"expectedImpact": 6,</span></code></div>
        <div class="json-line" :class="lineState(0)"><span class="json-marker" /><code class="json-content json-indent-1"><span class="json-neutral">"targets": [</span></code></div>
        <div class="json-line" :class="lineState(0)"><span class="json-marker" /><code class="json-content json-indent-2">{</code></div>
        <div class="json-line" :class="lineState(1)"><span class="json-marker">①</span><code class="json-content json-indent-3"><span class="json-neutral">"metricId": "b14738e0-</span><span class="json-ellipsis">…</span><span class="json-neutral">c00c8",</span></code></div>
        <div class="json-line" :class="lineState(2)"><span class="json-marker">②</span><code class="json-content json-indent-3"><span class="json-neutral">"operator": </span><span class="json-value">"LTE"</span><span class="json-neutral">,</span></code></div>
        <div class="json-line" :class="lineState(3)"><span class="json-marker">③</span><code class="json-content json-indent-3"><span class="json-neutral">"baselineValue": </span><span class="json-value">"12.0000"</span><span class="json-neutral">,</span><span class="json-pill">antes: 12 s</span></code></div>
        <div class="json-line" :class="lineState(3)"><span class="json-marker" /><code class="json-content json-indent-3"><span class="json-neutral">"targetValue": </span><span class="json-value">"5.0000"</span><span class="json-neutral">,</span><span class="json-pill">meta: ≤ 5 s</span></code></div>
        <div class="json-line" :class="lineState(4)"><span class="json-marker">④</span><code class="json-content json-indent-3"><span class="json-neutral">"evaluateAt": </span><span class="json-value">"2026-12-01T00:00:00.000Z"</span></code></div>
        <div class="json-line" :class="lineState(0)"><span class="json-marker" /><code class="json-content json-indent-2">}</code></div>
        <div class="json-line" :class="lineState(0)"><span class="json-marker" /><code class="json-content json-indent-1">]</code></div>
        <div class="json-line" :class="lineState(0)"><span class="json-marker" /><code class="json-content">}</code></div>
      </div>

      <div class="expectation-impact">expectedImpact: escala assinada de −10 a +10; campo opcional.</div>
    </div>

    <div class="expectation-notes">
      <div class="expectation-note" :class="{ 'is-visible': $clicks >= 2, 'is-current': activeStep === 1 }">
        <h2><span>①</span>Ligada a uma métrica real.</h2>
        <p>A métrica precisa pertencer à mesma decisão.</p>
      </div>
      <div class="expectation-note" :class="{ 'is-visible': $clicks >= 3, 'is-current': activeStep === 2 }">
        <h2><span>②</span>Sem ambiguidade.</h2>
        <p class="operator-options"><span><span class="operator-chip">LTE</span> menor ou igual</span><span><span class="operator-chip">GTE</span> maior ou igual</span><span><span class="operator-chip">EQ</span> igual</span></p>
      </div>
      <div class="expectation-note" :class="{ 'is-visible': $clicks >= 4, 'is-current': activeStep === 3 }">
        <h2><span>③</span>Precisão exata.</h2>
        <p><span class="mono">Decimal(18,4)</span>, sem surpresas de ponto flutuante.</p>
      </div>
      <div class="expectation-note" :class="{ 'is-visible': $clicks >= 5, 'is-current': activeStep === 4 }">
        <h2><span>④</span>Com prazo.</h2>
        <p>A promessa tem data para ser conferida.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.expectation-example {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  gap: 38px;
  align-items: stretch;
  width: 100%;
  margin-top: 2px;
}
.expectation-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 0;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 480ms ease, transform 480ms ease;
}
.expectation-card.is-visible {
  opacity: 1;
  transform: none;
}
.expectation-endpoint {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 49px;
  padding: 0 18px;
  border-bottom: 1px solid var(--border-strong);
  color: var(--muted);
  font: 600 16px/1.2 var(--conference-font-mono, "Geist Mono Variable", monospace);
  white-space: nowrap;
}
.expectation-method { color: var(--accent-from); }
.expectation-json {
  padding: 15px 17px 12px 12px;
  font: 500 17px/1.34 var(--conference-font-mono, "Geist Mono Variable", monospace);
}
.json-line {
  display: flex;
  align-items: center;
  min-height: 23px;
  white-space: nowrap;
  transition: opacity 420ms ease, background-color 420ms ease;
}
.json-line.is-dimmed { opacity: .45; }
.json-line.is-active {
  border-radius: 5px;
  background: color-mix(in srgb, var(--accent-from) 8%, transparent);
}
.json-marker {
  flex: 0 0 25px;
  color: var(--subtle);
  font: 500 17px/1.2 var(--conference-font-mono, "Geist Mono Variable", monospace);
}
.json-line.is-active .json-marker { color: var(--accent-from); }
.json-content {
  display: block;
  min-width: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: none;
  color: var(--muted);
  font: inherit;
}
.json-indent-1 { padding-left: 1.25em; }
.json-indent-2 { padding-left: 2.5em; }
.json-indent-3 { padding-left: 3.75em; }
.json-neutral { color: var(--muted); }
.json-ellipsis { color: var(--subtle); }
.json-value { color: var(--accent-to); }
.json-pill {
  display: inline-block;
  margin-left: 10px;
  padding: 2px 7px;
  border: 1px solid var(--border-strong);
  border-radius: 999px;
  background: var(--bg-elevated);
  color: var(--muted);
  font: 500 12px/1.1 var(--conference-font-mono, "Geist Mono Variable", monospace);
  vertical-align: 2px;
}
.expectation-impact {
  margin-top: auto;
  padding: 11px 18px 12px;
  border-top: 1px solid var(--border-strong);
  color: var(--subtle);
  font: 500 14px/1.25 var(--conference-font-mono, "Geist Mono Variable", monospace);
  white-space: nowrap;
}
.expectation-notes {
  display: grid;
  grid-template-rows: repeat(4, auto);
  min-width: 0;
}
.expectation-note {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  padding: 10px 0;
  border-top: 1px solid var(--border-strong);
  opacity: 0;
  transform: translateY(7px);
  transition: opacity 480ms ease, transform 480ms ease;
}
.expectation-note:last-child { border-bottom: 1px solid var(--border-strong); }
.expectation-note.is-visible {
  opacity: 1;
  transform: none;
}
.expectation-note h2 {
  display: flex;
  align-items: baseline;
  gap: 9px;
  margin: 0 0 5px;
  color: var(--fg);
  font-size: 29px;
  font-weight: 600;
  line-height: 1.08;
  letter-spacing: -.03em;
}
.expectation-note h2 span {
  color: var(--accent-from);
  font-weight: 500;
}
.expectation-note p {
  margin: 0;
  color: var(--muted);
  font-size: 21px;
  line-height: 1.22;
}
.operator-chip {
  display: inline-block;
  padding: 1px 5px;
  border: 1px solid color-mix(in srgb, var(--accent-from) 42%, transparent);
  border-radius: 5px;
  background: color-mix(in srgb, var(--accent-from) 10%, transparent);
  color: var(--accent-from);
  font: inherit;
  white-space: nowrap;
}
.operator-options {
  display: flex;
  flex-wrap: wrap;
  gap: 5px 12px;
}
.operator-options > span { white-space: nowrap; }
.mono { font-family: var(--conference-font-mono, "Geist Mono Variable", monospace); }
@media (prefers-reduced-motion: reduce) {
  .expectation-card,
  .json-line,
  .expectation-note { transition: none; transform: none; }
}
</style>
