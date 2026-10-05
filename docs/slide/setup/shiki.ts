import { defineShikiSetup } from "@slidev/types";

export default defineShikiSetup(() => ({
  themes: {
    dark: {
      name: "echoes-dark",
      type: "dark",
      colors: {
        "editor.background": "#0A0A0A",
        "editor.foreground": "#C9D0DD",
      },
      tokenColors: [
        {
          scope: ["support.type.property-name.json", "meta.object-literal.key"],
          settings: { foreground: "#82AEFF" },
        },
        {
          scope: ["string.quoted.double.json"],
          settings: { foreground: "#B9A0F5" },
        },
        {
          scope: ["constant.numeric.json", "constant.language.json"],
          settings: { foreground: "#8AB9FF" },
        },
        {
          scope: ["punctuation.definition.string.json", "punctuation.separator.dictionary.key-value.json", "punctuation.separator.array.json"],
          settings: { foreground: "#8F99AD" },
        },
      ],
    },
    light: "vitesse-light",
  },
}));
