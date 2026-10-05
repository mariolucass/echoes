<script setup lang="ts">
import { computed } from 'vue'
import { useSlideContext } from '@slidev/client'

const { $clicks } = useSlideContext()
const step = computed(() => Math.min(Number($clicks.value) || 0, 4))

// Eixo de 0 a 12 s. Menor é melhor.
const AXIS = 12
const pct = (s: number) => `${(s / AXIS) * 100}%`
const span = (a: number, b: number) => ({ left: pct(a), width: `${((b - a) / AXIS) * 100}%` })
</script>

<template>
  <div class="goal" :data-step="step">
    <div class="kpis">
      <div class="kpi kpi--before" :class="{ 'is-on': step >= 1 }">
        <div class="kpi-label">Antes</div>
        <div class="kpi-value">{{ step >= 1 ? '12 s' : '—' }}</div>
      </div>
      <div class="kpi kpi--goal" :class="{ 'is-on': step >= 2 }">
        <div class="kpi-label">Meta congelada</div>
        <div class="kpi-value">{{ step >= 2 ? '≤ 5 s' : '—' }}</div>
      </div>
      <div class="kpi kpi--measured" :class="{ 'is-on': step >= 3 }">
        <div class="kpi-label">Medido</div>
        <div class="kpi-value">{{ step >= 3 ? '9 s' : '—' }}</div>
      </div>
    </div>

    <div class="ruler" role="img" aria-label="Régua de 0 a 12 segundos: antes 12 s, meta até 5 s, medido 9 s">
      <div class="ticks">
        <span class="tick tick--edge" style="left: 0">0 s</span>
        <span class="tick tick--goal" :class="{ 'is-on': step >= 2 }" :style="{ left: pct(5) }">5 s</span>
        <span class="tick tick--measured" :class="{ 'is-on': step >= 3 }" :style="{ left: pct(9) }">9 s</span>
        <span class="tick tick--edge" :class="{ 'is-on': step >= 1 }" :style="{ left: pct(12) }">12 s</span>
      </div>

      <div class="track">
        <div class="zone" :class="{ 'is-on': step >= 2 }" :style="{ width: pct(5) }" />
        <span class="dot dot--before" :class="{ 'is-on': step >= 1, 'is-past': step >= 3 }" :style="{ left: pct(12) }" />
        <span class="dot dot--measured" :class="{ 'is-on': step >= 3 }" :style="{ '--to': pct(9) }" />
      </div>

      <div class="brackets">
        <div class="bracket bracket--gap" :class="{ 'is-on': step >= 3 }" :style="span(5, 9)">
          <span>+4 s acima da meta</span>
        </div>
        <div class="bracket bracket--gain" :class="{ 'is-on': step >= 3 }" :style="span(9, 12)">
          <span>−3 s · 25%</span>
        </div>
      </div>
    </div>

    <div class="verdict-row">
      <div class="verdict-cell verdict-cell--yes" :class="{ 'is-on': step >= 4 }">
        <div class="verdict-q">Melhorou?</div>
        <div class="verdict-a"><strong>Sim.</strong><span>25% mais rápido.</span></div>
      </div>
      <div class="verdict-cell verdict-cell--no" :class="{ 'is-on': step >= 4 }">
        <div class="verdict-q">Cumpriu o que prometeu?</div>
        <div class="verdict-a"><strong>Não.</strong><span class="pill">NOT_MET</span></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.goal { --ease: cubic-bezier(.2, .8, .2, 1); display: flex; flex-direction: column; width: 100%; }
.mono, .kpi-label, .tick, .verdict-q, .pill { font-family: var(--conference-font-mono, "Geist Mono Variable", monospace); }

/* KPIs */
.kpis { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border-top: 1px solid var(--border-strong); border-bottom: 1px solid var(--border); }
.kpi { padding: 20px 28px 18px; opacity: .3; transition: opacity 600ms var(--ease); }
.kpi + .kpi { border-left: 1px solid var(--border); }
.kpi.is-on { opacity: 1; }
.kpi-label { color: var(--subtle); font-size: 14px; font-weight: 600; letter-spacing: .11em; text-transform: uppercase; }
.kpi-value { margin-top: 8px; color: var(--fg); font-size: 76px; font-weight: 600; line-height: 1; letter-spacing: -.055em; }
.kpi--before .kpi-value { color: var(--muted); }
.kpi--goal .kpi-value { color: var(--success); }
.kpi--measured .kpi-value { background: var(--accent); background-clip: text; -webkit-background-clip: text; color: transparent; }

/* Régua */
.ruler { margin-top: 30px; }
.ticks { position: relative; height: 22px; }
.tick {
  position: absolute;
  top: 0;
  color: var(--subtle);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: .06em;
  transform: translateX(-50%);
  opacity: 0;
  transition: opacity 500ms var(--ease);
}
.tick--edge:first-child { opacity: 1; transform: none; }
.tick.is-on { opacity: 1; }
.tick--edge.is-on { transform: translateX(-100%); }
.tick--goal.is-on { color: var(--success); }
.tick--measured.is-on { color: var(--fg); }

.track { position: relative; height: 12px; border-radius: 999px; background: #161616; box-shadow: inset 0 0 0 1px var(--border); }
.zone {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: 999px;
  background: color-mix(in srgb, var(--success) 30%, transparent);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--success) 60%, transparent), 0 0 24px color-mix(in srgb, var(--success) 22%, transparent);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 800ms var(--ease);
}
.zone.is-on { transform: scaleX(1); }

.dot { position: absolute; top: 50%; width: 22px; height: 22px; margin: -11px 0 0 -11px; border-radius: 50%; opacity: 0; }
.dot--before { border: 2px solid var(--muted); background: var(--bg); transition: opacity 500ms var(--ease); }
.dot--before.is-on { opacity: 1; }
.dot--before.is-past { opacity: .45; }
.dot--measured {
  left: var(--to);
  background: var(--accent);
  box-shadow: 0 0 0 5px color-mix(in srgb, var(--accent-from) 22%, transparent), 0 0 22px color-mix(in srgb, var(--accent-from) 60%, transparent);
}
.dot--measured.is-on { opacity: 1; animation: slide-in 1000ms var(--ease) both; }
@keyframes slide-in {
  from { left: 100%; opacity: 0; }
  12% { opacity: 1; }
  to { left: var(--to); opacity: 1; }
}

.brackets { position: relative; height: 44px; margin-top: 12px; }
.bracket {
  position: absolute;
  top: 0;
  box-sizing: border-box;
  height: 10px;
  border: 1.5px solid currentColor;
  border-top: 0;
  border-radius: 0 0 6px 6px;
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity 600ms var(--ease) 500ms, transform 600ms var(--ease) 500ms;
}
.bracket.is-on { opacity: 1; transform: none; }
.bracket span {
  position: absolute;
  top: 17px;
  left: 50%;
  font: 600 16px/1 var(--conference-font-mono, "Geist Mono Variable", monospace);
  white-space: nowrap;
  transform: translateX(-50%);
}
.bracket--gap { color: var(--warning); }
.bracket--gain { color: var(--success); }

/* Veredito */
.verdict-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: 22px; border-top: 1px solid var(--border-strong); }
.verdict-cell { padding: 20px 28px 0; opacity: 0; transform: translateY(8px); transition: opacity 600ms var(--ease), transform 600ms var(--ease); }
.verdict-cell + .verdict-cell { border-left: 1px solid var(--border); transition-delay: 220ms; }
.verdict-cell.is-on { opacity: 1; transform: none; }
.verdict-q { color: var(--subtle); font-size: 14px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; }
.verdict-a { display: flex; align-items: baseline; gap: 18px; margin-top: 8px; }
.verdict-a strong { font-size: 56px; font-weight: 600; line-height: 1; letter-spacing: -.045em; }
.verdict-a span { color: var(--muted); font-size: 24px; letter-spacing: -.02em; }
.verdict-cell--yes strong { color: var(--success); }
.verdict-cell--no strong { color: var(--warning); }
.pill {
  padding: 5px 12px;
  border: 1px solid color-mix(in srgb, var(--warning) 50%, transparent);
  border-radius: 8px;
  background: color-mix(in srgb, var(--warning) 11%, transparent);
  color: var(--warning) !important;
  font-size: 18px !important;
  font-weight: 600;
  letter-spacing: 0;
}

@media print, (prefers-reduced-motion: reduce) {
  .kpi, .tick, .zone, .dot, .bracket, .verdict-cell { transition: none; }
  .dot--measured.is-on { animation: none; }
}
</style>
