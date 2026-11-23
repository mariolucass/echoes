/**
 * E-mail de verificação em duas etapas, com a identidade visual do Echoes.
 *
 * Compatível com clientes de e-mail: layout em tabelas, CSS inline, sem SVG
 * (o Gmail remove) e sem fontes web. A marca "E" é montada com células de
 * tabela, então aparece igual em qualquer cliente.
 */

const C = {
  bg: "#240510",
  bgTop: "#3B0B1E",
  card: "#2F0817",
  tile: "#3A0C1F",
  line: "#43242F",
  mint: "#D6EEE0",
  muted: "#AECDBC",
  subtle: "#8CAE9C",
  rose: "#F08BA6",
  green: "#1B5A43",
} as const;

const SERIF = "Georgia,'Times New Roman',serif";
const SANS =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
const MONO = "'SF Mono',Menlo,Consolas,'Courier New',monospace";
const GRADIENT = `linear-gradient(90deg,${C.rose} 0%,${C.mint} 55%,${C.green} 100%)`;

export interface TwoFactorEmailInput {
  name: string;
  email: string;
  code: string;
  ttlMinutes: number;
  now?: Date;
  timeZone?: string;
}

export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** Marca "E" do Echoes em blocos (mesma geometria do ícone SVG). */
function logoMark(): string {
  const cell = (w: number, h: number, color?: string) =>
    `<td width="${w}" height="${h}" bgcolor="${color ?? ""}" style="width:${w}px;height:${h}px;font-size:0;line-height:0;${color ? `background:${color};` : ""}">&nbsp;</td>`;
  const row = (h: number, cells: Array<[number, string?]>) =>
    `<tr>${cells.map(([w, color]) => cell(w, h, color)).join("")}</tr>`;
  const m = C.mint;
  const r = C.rose;
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
${row(6, [[6, m], [6, m], [4, m], [8, m]])}
${row(4, [[6, m], [6], [4], [8]])}
${row(6, [[6, m], [6, m], [4, m], [8]])}
${row(4, [[6, m], [6], [4], [8]])}
${row(6, [[6, m], [6, r], [4, r], [8, r]])}
</table>`;
}

function formatTime(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(date);
}

function formatDate(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone,
  }).format(date);
}

export function renderTwoFactorEmail(
  input: TwoFactorEmailInput,
): RenderedEmail {
  const { code, ttlMinutes } = input;
  const timeZone = input.timeZone ?? "America/Sao_Paulo";
  const now = input.now ?? new Date();
  const expires = new Date(now.getTime() + ttlMinutes * 60_000);
  const firstName = input.name.trim().split(/\s+/)[0] || "você";
  const safeFirst = escapeHtml(firstName);
  const safeEmail = escapeHtml(input.email);
  const requestedTime = formatTime(now, timeZone);
  const requestedDate = formatDate(now, timeZone);
  const expiresTime = formatTime(expires, timeZone);

  const subject = `${code} é o seu código de acesso ao Echoes`;

  // O trecho "é 123456." é usado pelos testes e pelo preenchimento automático.
  const text = [
    `Olá, ${input.name}.`,
    "",
    `Seu código de verificação é ${code}. Ele expira em ${ttlMinutes} minutos.`,
    "",
    "Nunca compartilhe este código. A equipe do Echoes jamais pede por ele.",
    "Se não foi você, ignore este e-mail: sem o código, ninguém entra na sua conta.",
    "",
    "Echoes · Registre antes. Meça depois.",
  ].join("\n");

  const tiles = code
    .split("")
    .map(
      (digit) => `<td align="center" width="56" bgcolor="${C.tile}" style="width:56px;height:72px;background:${C.tile};border:1px solid ${C.line};border-radius:16px;font-family:${SERIF};font-size:38px;line-height:72px;font-weight:700;color:${C.mint};">${escapeHtml(digit)}</td>`,
    )
    .join(`<td width="8" style="width:8px;font-size:0;line-height:0;">&nbsp;</td>`);

  const bullet = (title: string, body: string) => `<tr>
<td valign="top" width="22" style="width:22px;padding:2px 0 0 0;font-size:0;line-height:0;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td width="8" height="8" bgcolor="${C.rose}" style="width:8px;height:8px;background:${C.rose};border-radius:4px;font-size:0;line-height:0;">&nbsp;</td></tr></table></td>
<td style="padding:0 0 18px 0;font-family:${SANS};font-size:14px;line-height:21px;color:${C.muted};"><strong style="color:${C.mint};font-weight:600;">${title}</strong><br>${body}</td>
</tr>`;

  const html = `<!DOCTYPE html>
<html lang="pt-BR" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${C.bg};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.bg};font-size:1px;line-height:1px;">Seu código é ${code}. Válido por ${ttlMinutes} minutos. Nunca compartilhe.&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.bg}" style="background:${C.bg};background-image:linear-gradient(180deg,${C.bgTop} 0%,${C.bg} 420px);">
<tr><td align="center" style="padding:40px 16px 48px 16px;">

<table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;">

<!-- Marca -->
<tr><td style="padding:0 8px 36px 8px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td valign="middle" width="40" style="width:40px;">${logoMark()}</td>
<td valign="middle" style="padding-left:14px;font-family:${SERIF};font-size:26px;line-height:28px;font-weight:700;letter-spacing:-0.5px;color:${C.mint};">Echoes</td>
<td valign="middle" align="right" style="font-family:${SANS};font-size:11px;line-height:14px;letter-spacing:2px;text-transform:uppercase;color:${C.subtle};">Acesso seguro</td>
</tr></table>
</td></tr>

<!-- Título -->
<tr><td style="padding:0 8px 28px 8px;">
<div style="font-family:${SANS};font-size:12px;line-height:16px;letter-spacing:3px;text-transform:uppercase;color:${C.rose};padding-bottom:14px;">Verificação em duas etapas</div>
<div style="font-family:${SERIF};font-size:42px;line-height:46px;font-weight:700;letter-spacing:-1.2px;color:${C.mint};">A chave certa,<br>${safeFirst}.</div>
<div style="font-family:${SANS};font-size:16px;line-height:25px;color:${C.muted};padding-top:16px;">Sua senha está certa. Falta um último passo: digite o código abaixo para abrir o seu espaço de decisões.</div>
</td></tr>

<!-- Cartão do código -->
<tr><td>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.line}" style="background:${C.rose};background-image:${GRADIENT};border-radius:26px;">
<tr><td style="padding:1px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.card}" style="background:${C.card};border-radius:25px;">
<tr><td align="center" style="padding:34px 20px 8px 20px;font-family:${SANS};font-size:11px;line-height:14px;letter-spacing:3px;text-transform:uppercase;color:${C.subtle};">Seu código de verificação</td></tr>
<tr><td align="center" style="padding:16px 12px 8px 12px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr>${tiles}</tr></table>
</td></tr>
<tr><td align="center" style="padding:14px 20px 4px 20px;font-family:${MONO};font-size:13px;line-height:18px;letter-spacing:6px;color:${C.subtle};">${escapeHtml(code)}</td></tr>
<tr><td style="padding:22px 36px 0 36px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td bgcolor="${C.rose}" height="4" style="height:4px;background:${C.rose};background-image:${GRADIENT};border-radius:2px;font-size:0;line-height:0;">&nbsp;</td>
</tr></table>
</td></tr>
<tr><td style="padding:12px 36px 32px 36px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="font-family:${SANS};font-size:13px;line-height:18px;color:${C.muted};">Válido por <strong style="color:${C.mint};">${ttlMinutes} minutos</strong></td>
<td align="right" style="font-family:${SANS};font-size:13px;line-height:18px;color:${C.subtle};">expira às ${expiresTime}</td>
</tr></table>
</td></tr>
</table>
</td></tr>
</table>
</td></tr>

<!-- Segurança -->
<tr><td style="padding:36px 8px 8px 8px;">
<div style="font-family:${SANS};font-size:11px;line-height:14px;letter-spacing:3px;text-transform:uppercase;color:${C.subtle};padding-bottom:18px;">Antes de continuar</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${bullet("Este código é só seu", "O Echoes jamais pede por ele, nem por e-mail, nem por mensagem, nem por telefone.")}
${bullet("Não foi você?", "Ignore este e-mail. Sem o código, ninguém entra na sua conta. Se isso se repetir, troque a sua senha.")}
${bullet("Pedido registrado", `${requestedDate}, ${requestedTime} (horário de Brasília).`)}
</table>
</td></tr>

<!-- Rodapé -->
<tr><td style="padding:28px 8px 0 8px;border-top:1px solid ${C.line};">
<div style="font-family:${SERIF};font-style:italic;font-size:20px;line-height:26px;color:${C.mint};padding-top:28px;">Registre antes. <span style="color:${C.rose};">Meça depois.</span></div>
<div style="font-family:${SANS};font-size:12px;line-height:19px;color:${C.subtle};padding-top:12px;">Echoes · decisões que se medem.<br>Enviado para ${safeEmail} porque houve uma tentativa de login na sua conta.</div>
</td></tr>

</table>

</td></tr>
</table>
</body>
</html>`;

  return { subject, text, html };
}
