---
# Configuração central. Conteúdo da apresentação em slides.md.
# Usa o tema local em layouts/ e styles/, sem um tema npm adicional.
theme: none
title: Echoes N2 — Segurança, nuvem e testes
titleTemplate: "%s"
author: Equipe Echoes
info: |
  Atividade N2 de PSW2: nuvem, segurança, testes e exportação.
keywords: Echoes, MongoDB Atlas, Cloudinary, 2FA, CORS, CSV
aspectRatio: 16/9
canvasWidth: 1280
colorSchema: dark
transition: push | push-back
presenter: true
browserExporter: dev
download: false
exportFilename: echoes-n2
export:
  format: pdf
  dark: true
  withClicks: true
  withToc: true
  timeout: 60000
monaco: false
twoslash: false
lineNumbers: false
record: false
routerMode: hash
fonts:
  sans: Atkinson Hyperlegible Next Variable
  serif: Manuale Variable
  mono: Atkinson Hyperlegible Next Variable
  provider: none
themeConfig:
  primary: "#4F8CFF"
defaults:
  layout: default
drawings:
  enabled: false
htmlAttrs:
  lang: pt-BR
  data-deck: n2
src: ./slides-n2.md
---
