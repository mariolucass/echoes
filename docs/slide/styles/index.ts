// @ts-expect-error CSS side-effect import is handled by the bundler.
import "@fontsource-variable/geist/wght.css";
// @ts-expect-error CSS side-effect import is handled by the bundler.
import "@fontsource-variable/geist-mono/wght.css";
// @ts-expect-error CSS side-effect import is handled by the bundler.
import "./conference.css";
import { reportTokens } from "../../../src/export/report-tokens.js";

document.documentElement.style.setProperty(
  "--accent-from",
  reportTokens.accentFrom,
);
document.documentElement.style.setProperty(
  "--accent-to",
  reportTokens.accentTo,
);
// Fontes do design system Echoes (frontend/src/shared/config/fonts.ts).
// @ts-expect-error CSS side-effect import is handled by the bundler.
import "@fontsource-variable/atkinson-hyperlegible-next/wght.css";
// @ts-expect-error CSS side-effect import is handled by the bundler.
import "@fontsource-variable/atkinson-hyperlegible-next/wght-italic.css";
// @ts-expect-error CSS side-effect import is handled by the bundler.
import "@fontsource-variable/manuale/wght.css";
// @ts-expect-error CSS side-effect import is handled by the bundler.
import "@fontsource-variable/manuale/wght-italic.css";
// @ts-expect-error CSS side-effect import is handled by the bundler.
import "@fontsource/grenze/500.css";
// @ts-expect-error CSS side-effect import is handled by the bundler.
import "@fontsource/grenze/600.css";
// @ts-expect-error CSS side-effect import is handled by the bundler.
import "@fontsource/grenze/700.css";
// @ts-expect-error CSS side-effect import is handled by the bundler.
import "@fontsource-variable/caveat/wght.css";
// @ts-expect-error CSS side-effect import is handled by the bundler.
import "./echoes-n2.css";
