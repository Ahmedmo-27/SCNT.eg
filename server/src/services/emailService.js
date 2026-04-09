const nodemailer = require("nodemailer");
const env = require("../config/env");

const SMTP_PORT = Number(env.smtpPort || 587);
const SMTP_HOST = env.smtpHost || "smtp.gmail.com";

const isMailerConfigured =
  Boolean(env.smtpUser) &&
  Boolean(env.smtpPass) &&
  Boolean(env.smtpFrom);

const transporter = isMailerConfigured
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass,
      },
    })
  : null;

const BRAND = {
  name: "SCNT.eg",
  tagline: "House of SCNT",
  bg: "#f6f3ef",
  panel: "#ffffff",
  ink: "#171412",
  muted: "#6a615b",
  accent: "#2a2622",
  border: "#e7dfd7",
};

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const getVerificationUrl = (token) => {
  if (!env.clientBaseUrl) return null;
  const baseUrl = env.clientBaseUrl.replace(/\/+$/, "");
  return `${baseUrl}/verify-email?token=${encodeURIComponent(token)}`;
};

const sendEmail = async ({ to, subject, text, html }) => {
  if (!isMailerConfigured || !transporter) {
    return { sent: false, reason: "SMTP not configured" };
  }

  await transporter.sendMail({
    from: env.smtpFrom,
    to,
    subject,
    text,
    html,
  });

  return { sent: true };
};

const wrapEmailLayout = ({ eyebrow, title, intro, bodyHtml, ctaHtml, footerNote }) => `
  <div style="margin:0;padding:32px 14px;background:${BRAND.bg};color:${BRAND.ink};font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px;margin:0 auto;background:${BRAND.panel};border:1px solid ${BRAND.border};border-radius:16px;overflow:hidden;">
      <tr>
        <td style="padding:24px 24px 8px 24px;border-bottom:1px solid ${BRAND.border};">
          <p style="margin:0 0 8px 0;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${BRAND.muted};">${escapeHtml(
            BRAND.tagline
          )}</p>
          <h1 style="margin:0;font-size:28px;line-height:1.2;color:${BRAND.ink};font-weight:700;">${escapeHtml(
            BRAND.name
          )}</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:22px 24px 8px 24px;">
          ${eyebrow ? `<p style="margin:0 0 10px 0;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:${BRAND.muted};">${escapeHtml(eyebrow)}</p>` : ""}
          <h2 style="margin:0 0 12px 0;font-size:24px;line-height:1.25;color:${BRAND.ink};">${escapeHtml(title)}</h2>
          <p style="margin:0 0 14px 0;font-size:15px;line-height:1.65;color:${BRAND.muted};">${escapeHtml(intro)}</p>
          ${bodyHtml || ""}
          ${ctaHtml || ""}
          ${
            footerNote
              ? `<p style="margin:20px 0 0 0;font-size:12px;line-height:1.6;color:${BRAND.muted};">${escapeHtml(footerNote)}</p>`
              : ""
          }
        </td>
      </tr>
      <tr>
        <td style="padding:16px 24px 22px 24px;border-top:1px solid ${BRAND.border};">
          <p style="margin:0;font-size:12px;line-height:1.6;color:${BRAND.muted};">
            You received this email from ${escapeHtml(BRAND.name)}.
          </p>
          <p style="margin:6px 0 0 0;font-size:12px;line-height:1.6;color:${BRAND.muted};">
            Curated luxury fragrances. Four identities, one house.
          </p>
        </td>
      </tr>
    </table>
  </div>
`;

const sendVerificationEmail = async ({ to, fullName, token }) => {
  const verificationUrl = getVerificationUrl(token);
  const fallbackText = `Use this verification token: ${token}`;
  const actionText = verificationUrl || fallbackText;
  const recipient = fullName || "there";

  const subject = "Welcome to SCNT.eg - Verify your email";
  const text = [
    `Hi ${recipient},`,
    "",
    "Welcome to SCNT.eg.",
    "Please verify your email to secure your account and receive tailored offers.",
    actionText,
    "",
    "You can still use your account before verification.",
    "If you did not create this account, you can ignore this message.",
  ].join("\n");
  const bodyHtml = `
    <p style="margin:0 0 14px 0;font-size:15px;line-height:1.65;color:${BRAND.ink};">Hi ${escapeHtml(recipient)},</p>
    <p style="margin:0 0 14px 0;font-size:15px;line-height:1.65;color:${BRAND.ink};">
      Welcome to SCNT.eg. Verify your email to secure your account and unlock newsletter drops, curated offers, and promo-code updates.
    </p>
    ${
      !verificationUrl
        ? `<p style="margin:0 0 14px 0;padding:12px 14px;background:${BRAND.bg};border:1px solid ${BRAND.border};border-radius:10px;font-size:14px;color:${BRAND.ink};">
             Your verification token: <strong>${escapeHtml(token)}</strong>
           </p>`
        : ""
    }
  `;
  const ctaHtml = verificationUrl
    ? `<p style="margin:18px 0 0 0;">
         <a href="${verificationUrl}" style="display:inline-block;background:${BRAND.accent};color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-size:14px;font-weight:700;">
           Verify my email
         </a>
       </p>`
    : "";
  const footerNote = "You can verify now or later. Your account remains active.";
  const html = wrapEmailLayout({
    eyebrow: "Account security",
    title: "Verify your email address",
    intro: "A quick verification keeps your profile safe and ensures you never miss exclusive SCNT releases.",
    bodyHtml,
    ctaHtml,
    footerNote,
  });

  return sendEmail({ to, subject, text, html });
};

const sendPromotionalEmail = async ({ to, subject, preheader, contentHtml }) => {
  const safeSubject = String(subject || "").trim() || "New SCNT.eg Offer";
  const safePreheader = String(preheader || "").trim() || "Exclusive updates from House of SCNT.";
  const text = `${safePreheader}\n\n${(contentHtml || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()}`;
  const bodyHtml = `
    <div style="margin:0 0 14px 0;padding:14px;border:1px solid ${BRAND.border};border-radius:12px;background:${BRAND.bg};">
      <p style="margin:0;font-size:14px;line-height:1.6;color:${BRAND.muted};">${escapeHtml(safePreheader)}</p>
    </div>
    <div style="font-size:15px;line-height:1.7;color:${BRAND.ink};">
      ${contentHtml || ""}
    </div>
  `;
  const html = wrapEmailLayout({
    eyebrow: "Newsletter & offers",
    title: safeSubject,
    intro: "Fresh drops, limited offers, and promo-code moments selected for your SCNT journey.",
    bodyHtml,
    ctaHtml: "",
    footerNote: "If this campaign includes a promo code, apply it at checkout before expiry.",
  });

  return sendEmail({ to, subject: safeSubject, text, html });
};

module.exports = {
  isMailerConfigured,
  sendEmail,
  sendVerificationEmail,
  sendPromotionalEmail,
};
