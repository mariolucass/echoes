import { describe, expect, it } from "vitest";
import { renderTwoFactorEmail } from "../../../src/services/notification/templates/two-factor-email.js";

const base = {
  name: "Mário Lucas",
  email: "mario@example.com",
  code: "048213",
  ttlMinutes: 5,
  now: new Date("2026-11-17T23:25:00.000Z"),
  timeZone: "America/Sao_Paulo",
};

describe("renderTwoFactorEmail", () => {
  it("includes the code in subject, text and html, and keeps the text format", () => {
    const mail = renderTwoFactorEmail(base);
    expect(mail.subject).toContain("048213");
    expect(/(\d{6})\./.exec(mail.text)?.[1]).toBe("048213");
    expect(mail.html).toContain(">0<");
    expect(mail.html).toContain("Válido por");
    expect(mail.html).toContain("20:30"); // 23:25 UTC + 5 min em Brasília
  });

  it("greets by first name", () => {
    expect(renderTwoFactorEmail(base).html).toContain("A chave certa,<br>Mário.");
  });

  it("escapes user-controlled values", () => {
    const mail = renderTwoFactorEmail({
      ...base,
      name: '<img src=x onerror=alert(1)>',
      email: '"><script>x</script>@e.com',
    });
    expect(mail.html).not.toContain("<img src=x");
    expect(mail.html).not.toContain("<script>");
  });
});
