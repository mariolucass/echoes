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
