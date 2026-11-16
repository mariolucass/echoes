import { defineAppSetup } from "@slidev/types";

/**
 * Prepara os títulos do deck N2 para a animação de máscara: cada palavra vira
 * <span.w><span.wi>…</span></span> (revelação em linha) e, nos títulos grandes, cada letra
 * vira <span.c> (foco letra a letra). Preserva <em>, <br> e o gradiente.
 */
function splitTitle(h1: HTMLElement) {
  if (h1.dataset.split) return;
  const big = /conference--(cover|end|statement|livecode)/.test(
    h1.closest(".conference")?.className ?? "",
  );
  h1.dataset.split = big ? "chars" : "words";

  let index = 0;
  const walk = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement;
        if (el.tagName !== "BR") walk(el);
        continue;
      }
      if (child.nodeType !== Node.TEXT_NODE || !child.textContent) continue;
      const frag = document.createDocumentFragment();
      for (const part of child.textContent.split(/(\s+)/)) {
        if (!part) continue;
        if (/^\s+$/.test(part)) {
          frag.append(document.createTextNode(part));
          continue;
        }
        const word = document.createElement("span");
        word.className = "w";
        if (big) {
          for (const ch of Array.from(part)) {
            const c = document.createElement("span");
            c.className = "c";
            c.style.setProperty("--i", String(index++));
            c.textContent = ch;
            word.append(c);
          }
        } else {
          const inner = document.createElement("span");
          inner.className = "wi";
          inner.style.setProperty("--i", String(index++));
          inner.textContent = part;
          word.append(inner);
        }
        frag.append(word);
      }
      child.replaceWith(frag);
    }
  };
  walk(h1);
}

export default defineAppSetup(() => {
  if (typeof window === "undefined") return;
  const run = () => {
    if (document.documentElement.dataset.deck !== "n2") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document
      .querySelectorAll<HTMLElement>(".conference h1:not([data-split])")
      .forEach(splitTitle);
  };
  let frame = 0;
  const schedule = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(run);
  };
  new MutationObserver(schedule).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
  schedule();
});
