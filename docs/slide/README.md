# Apresentação do Echoes

Apresentação em Slidev com tema local: fundo preto, tipografia Geist, acento azul e violeta, layouts reutilizáveis e transição `fade`.

## Executar

Na raiz do repositório:

```sh
pnpm install
pnpm slides
```

Abra <http://localhost:3030>. A apresentação funciona sem iniciar a API ou o banco. Use o modo de apresentador do Slidev para consultar as notas.

## Editar

| Arquivo | Uso |
| --- | --- |
| `slides.config.md` | Configuração do Slidev, fontes e exportação |
| `slides.md` | Conteúdo dos 18 slides e notas do apresentador |
| `layouts/` | Layouts `cover`, `statement`, `default`, `two-cols`, `code`, `bento`, `stepper`, `stats` e `end` |
| `components/ConferenceFrame.vue` | Eyebrow e rodapé mínimo |
| `styles/conference.css` | Tokens, tipografia, composição e componentes |

`slides.config.md` é o arquivo de entrada e importa `slides.md` com `src: ./slides.md`. Separe slides com `---`. O conteúdo contém exemplos ilustrativos de 12 s, meta de 5 s e resultado de 9 s. As notas preservam as referências aos contratos e regras da API.

As fontes Geist e Geist Mono vêm do Google Fonts e exigem conexão ao abrir a apresentação. Para uso offline, instale as fontes e altere o provedor em `slides.config.md`.

## Build e PDF

```sh
pnpm slides:build
pnpm slides:export
```

O build estático sai em `docs/slide/dist/`. O PDF sai em `docs/slide/exports/echoes.pdf` e inclui uma página por estado de clique. Para instalar o Chromium necessário à exportação, execute `pnpm slides:setup` uma vez.

O modo de apresentador também está disponível no build estático. Revise as notas antes de compartilhar o site.
