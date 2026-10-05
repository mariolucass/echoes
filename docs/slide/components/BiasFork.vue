<script setup lang="ts">
import { useSlideContext } from '@slidev/client'

const { $clicks } = useSlideContext()
</script>

<template>
  <div class="bias-fork">
    <div class="fork-diagram">
      <svg class="fork-lines" viewBox="0 0 1088 286" preserveAspectRatio="none" aria-hidden="true">
        <path
          class="fork-line fork-line--success"
          :class="{ 'is-drawn': $clicks >= 2 }"
          pathLength="1"
          d="M 394 143 H 468 Q 491 143 505 122 L 532 88 Q 543 71 566 71"
        />
        <path
          class="fork-line fork-line--failure"
          :class="{ 'is-drawn': $clicks >= 3 }"
          pathLength="1"
          d="M 394 143 H 468 Q 491 143 505 164 L 532 198 Q 543 215 566 215"
        />
      </svg>

      <div
        class="fork-original"
        :class="{
          'is-visible': $clicks >= 1,
          'is-faded': $clicks === 2,
          'is-faded-more': $clicks >= 3,
        }"
      >
        <div class="fork-label"><span class="fork-dot" />O QUE VOCÊ PENSOU</div>
        <div class="fork-original-text">Deve funcionar.<br>Uns <span>60%</span>.</div>
      </div>

      <div class="fork-branches">
        <div class="fork-branch fork-branch--success" :class="{ 'is-drawn': $clicks >= 2 }">
          <div class="fork-label"><span class="fork-dot" />DEU CERTO</div>
          <div class="fork-quote"><span class="fork-quote-mark" aria-hidden="true">“</span>Eu sempre soube que ia funcionar.<span class="fork-quote-mark" aria-hidden="true">”</span></div>
        </div>
        <div class="fork-branch fork-branch--failure" :class="{ 'is-drawn': $clicks >= 3 }">
          <div class="fork-label"><span class="fork-dot" />DEU ERRADO</div>
          <div class="fork-quote"><span class="fork-quote-mark" aria-hidden="true">“</span>Ninguém tinha como prever isso.<span class="fork-quote-mark" aria-hidden="true">”</span></div>
        </div>
      </div>
    </div>

    <div class="fork-conclusion" :class="{ 'is-visible': $clicks >= 4 }">
      <p>Sem registro, só sobra a versão confortável.</p>
      <div class="fork-attribution">
        <span>VIÉS RETROSPECTIVO · HINDSIGHT BIAS · FISCHHOFF, 1975</span>
        <span class="fork-example">EXEMPLO ILUSTRATIVO</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bias-fork {
  width: 100%;
  margin-top: 4px;
}

.fork-diagram {
  position: relative;
  display: grid;
  grid-template-columns: 394fr 522fr;
  column-gap: 172px;
  align-items: center;
  height: 286px;
}

.fork-lines {
  position: absolute;
  z-index: 0;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}

.fork-line {
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  opacity: 0;
  transition: stroke-dashoffset 560ms ease;
}

.fork-line.is-drawn {
  stroke-dashoffset: 0;
  opacity: 1;
}
.fork-line--success { stroke: var(--success); }
.fork-line--failure { stroke: var(--warning); }

.fork-original {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 176px;
  padding: 28px 31px;
  border: 1.5px dashed #8496b6;
  border-radius: 18px;
  background: rgba(79, 140, 255, 0.055);
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 500ms ease, transform 500ms ease;
}

.fork-original.is-visible {
  opacity: 1;
  transform: translateY(0);
}
.fork-original.is-faded { opacity: .45; }
.fork-original.is-faded-more { opacity: .25; }

.fork-label {
  display: flex;
  align-items: center;
  gap: 11px;
  color: var(--muted);
  font: 600 15px/1.2 var(--conference-font-mono, "Geist Mono Variable", monospace);
  letter-spacing: .11em;
  white-space: nowrap;
}

.fork-dot {
  flex: 0 0 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 11px currentColor;
}

.fork-original-text {
  margin-top: 24px;
  color: var(--fg);
  font-size: 34px;
  font-weight: 400;
  line-height: 1.16;
  letter-spacing: -.035em;
}
.fork-original-text span {
  color: #a9c5ff;
  font-family: var(--conference-font-mono, "Geist Mono Variable", monospace);
  font-size: .9em;
}

.fork-branches {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 10px;
}
.fork-branch {
  min-height: 138px;
  padding: 10px 0 2px;
  opacity: 0;
  transform: translateX(12px);
  transition: opacity 500ms ease, transform 500ms ease;
}
.fork-branch.is-drawn {
  opacity: 1;
  transform: translateX(0);
}
.fork-branch--success .fork-label { color: var(--success); }
.fork-branch--failure .fork-label { color: var(--warning); }

.fork-quote {
  margin-top: 12px;
  color: var(--fg);
  font-size: 40px;
  font-weight: 400;
  line-height: 1.12;
  letter-spacing: -.035em;
  text-wrap: balance;
}
.fork-quote-mark {
  background: var(--accent);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}

.fork-conclusion {
  margin-top: 5px;
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 500ms ease, transform 500ms ease;
}
.fork-conclusion.is-visible {
  opacity: 1;
  transform: translateY(0);
}
.fork-conclusion p {
  color: var(--muted);
  font-size: 24px;
  line-height: 1.3;
}
.fork-attribution {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-top: 14px;
  color: var(--subtle);
  font: 500 13px/1.35 var(--conference-font-mono, "Geist Mono Variable", monospace);
  letter-spacing: .075em;
  white-space: nowrap;
}
.fork-example {
  padding: 5px 9px;
  border: 1px solid var(--border-strong);
  border-radius: 5px;
  color: var(--muted);
  letter-spacing: .06em;
}

@media (prefers-reduced-motion: reduce) {
  .fork-line,
  .fork-original,
  .fork-branch,
  .fork-conclusion {
    transition: none;
    transform: none;
  }
}
</style>
