/**
 * E-mail de verificação em duas etapas.
 *
 * Visual sóbrio: fundo claro, fonte do sistema, o código como único destaque.
 * Compatível com clientes de e-mail: layout em tabelas, CSS inline, sem SVG
 * e sem fontes web.
 */

const C = {
  page: "#F5F5F7",
  card: "#FFFFFF",
  text: "#1D1D1F",
  secondary: "#6E6E73",
  tertiary: "#86868B",
  line: "#D2D2D7",
} as const;

const SANS =
  "-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',Helvetica,Arial,sans-serif";
const DISPLAY =
  "-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Helvetica,Arial,sans-serif";

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
  const firstName = input.name.trim().split(/\s+/)[0] || "";
  const greeting = firstName ? `Olá, ${firstName}.` : "Olá.";
  const safeCode = escapeHtml(code);
  const safeEmail = escapeHtml(input.email);
  const requestedTime = formatTime(now, timeZone);
  const requestedDate = formatDate(now, timeZone);
  const expiresTime = formatTime(expires, timeZone);

  const subject = `Código de verificação do Echoes: ${code}`;

  // O trecho "é 123456." é usado pelos testes e pelo preenchimento automático.
  const text = [
    greeting,
    "",
    `Seu código de verificação é ${code}.`,
    `Ele expira em ${ttlMinutes} minutos, às ${expiresTime}.`,
    "",
    "Se você não tentou entrar, ignore este e-mail. Sem o código, ninguém acessa a sua conta.",
    "",
    `Enviado para ${input.email} em ${requestedDate}, às ${requestedTime} (horário de Brasília).`,
    "O Echoes nunca pede este código por telefone, mensagem ou e-mail.",
  ].join("\n");

  const p = (content: string, extra = "") =>
    `<p style="margin:0;font-family:${SANS};font-size:15px;line-height:22px;color:${C.secondary};${extra}">${content}</p>`;

  const html = `<!DOCTYPE html>
<html lang="pt-BR" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${C.page};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:${C.page};">Seu código é ${safeCode}. Expira em ${ttlMinutes} minutos.&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.page}" style="background:${C.page};">
<tr><td align="center" style="padding:48px 16px;">

<table role="presentation" width="520" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:520px;">

<tr><td style="padding:0 4px 24px 4px;font-family:${DISPLAY};font-size:19px;line-height:24px;font-weight:600;letter-spacing:-0.3px;color:${C.text};">Echoes</td></tr>

<tr><td bgcolor="${C.card}" style="background:${C.card};border-radius:18px;padding:40px 40px 36px 40px;">
<h1 style="margin:0 0 16px 0;font-family:${DISPLAY};font-size:28px;line-height:34px;font-weight:600;letter-spacing:-0.5px;color:${C.text};">Código de verificação</h1>
${p(`${escapeHtml(greeting)} Use este código para concluir o acesso à sua conta.`)}
<div style="margin:32px 0;font-family:${DISPLAY};font-size:40px;line-height:48px;font-weight:600;letter-spacing:10px;color:${C.text};">${safeCode}</div>
${p(`O código expira em ${ttlMinutes} minutos, às ${expiresTime}.`)}
${p("Se você não tentou entrar, ignore este e-mail. Sem o código, ninguém acessa a sua conta.", "padding-top:12px;")}
</td></tr>

<tr><td style="padding:24px 4px 0 4px;font-family:${SANS};font-size:12px;line-height:18px;color:${C.tertiary};">
Enviado para ${safeEmail} em ${requestedDate}, às ${requestedTime} (horário de Brasília).<br>
O Echoes nunca pede este código por telefone, mensagem ou e-mail.
</td></tr>

</table>

</td></tr>
</table>
</body>
</html>`;

  return { subject, text, html };
}
