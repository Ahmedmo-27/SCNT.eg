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

const currencyFormatter = new Intl.NumberFormat("en-EG", {
  style: "currency",
  currency: "EGP",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-EG", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

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
  <div style="margin:0;padding:32px 14px;background:${BRAND.bg};color:${BRAND.ink};font-family:'DM Sans',Arial,'Helvetica Neue',Helvetica,sans-serif;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px;margin:0 auto;background:${BRAND.panel};border:1px solid ${BRAND.border};border-radius:16px;overflow:hidden;">
      <tr>
        <td style="padding:24px 24px 8px 24px;border-bottom:1px solid ${BRAND.border};">
          <p style="margin:0 0 8px 0;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${BRAND.muted};font-family:'DM Sans',Arial,sans-serif;">${escapeHtml(
            BRAND.tagline
          )}</p>
          <h1 style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;line-height:1.2;color:${BRAND.ink};font-weight:700;">${escapeHtml(
            BRAND.name
          )}</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:22px 24px 8px 24px;">
          ${eyebrow ? `<p style="margin:0 0 10px 0;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:${BRAND.muted};font-family:'DM Sans',Arial,sans-serif;">${escapeHtml(eyebrow)}</p>` : ""}
          <h2 style="margin:0 0 12px 0;font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;line-height:1.25;color:${BRAND.ink};">${escapeHtml(title)}</h2>
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
            Curated fragrances. Four identities, one house.
          </p>
        </td>
      </tr>
    </table>
  </div>
`;

const formatCurrency = (amount) => currencyFormatter.format(Number(amount || 0));

const formatOrderDate = (value) => {
  const date = value instanceof Date ? value : new Date(value || Date.now());
  return dateFormatter.format(date);
};

const formatOrderNumber = (orderId) => {
  const raw = String(orderId || "").trim();
  if (!raw) return "";
  return `SCNT-${raw.slice(-8).toUpperCase()}`;
};

const formatShippingAddress = (address = {}) => {
  const lines = [
    address.fullName,
    address.phone,
    address.addressLine1,
    address.addressLine2,
    [address.city, address.postalCode].filter(Boolean).join(" "),
  ]
    .map((line) => String(line || "").trim())
    .filter(Boolean);

  return lines;
};

const buildOrderItemsHtml = (items = []) => {
  if (!items.length) {
    return `<p style="margin:0;font-size:14px;line-height:1.7;color:${BRAND.muted};">No item details were available for this order.</p>`;
  }

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate;border-spacing:0 10px;">
      ${items
        .map(
          (item) => `
            <tr>
              <td style="padding:14px 16px;background:${BRAND.bg};border:1px solid ${BRAND.border};border-radius:12px;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="vertical-align:top;">
                      <p style="margin:0 0 4px 0;font-size:15px;line-height:1.5;color:${BRAND.ink};font-weight:700;">${escapeHtml(
                        item.name
                      )}</p>
                      <p style="margin:0;font-size:13px;line-height:1.6;color:${BRAND.muted};">Qty ${escapeHtml(
                        item.quantity
                      )} ${item.unitPrice != null ? `&middot; ${escapeHtml(formatCurrency(item.unitPrice))} each` : ""}</p>
                    </td>
                    <td style="vertical-align:top;text-align:right;white-space:nowrap;">
                      <p style="margin:0;font-size:14px;line-height:1.6;color:${BRAND.ink};font-weight:700;">${escapeHtml(
                        formatCurrency(item.lineTotal)
                      )}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          `
        )
        .join("")}
    </table>
  `;
};

const buildAddressHtml = (address = {}) => {
  const lines = formatShippingAddress(address);
  if (!lines.length) {
    return `<p style="margin:0;font-size:14px;line-height:1.7;color:${BRAND.muted};">No shipping address was attached to this order.</p>`;
  }

  return `
    <div style="padding:14px 16px;background:${BRAND.bg};border:1px solid ${BRAND.border};border-radius:12px;">
      ${lines
        .map(
          (line) => `<p style="margin:0 0 4px 0;font-size:14px;line-height:1.6;color:${BRAND.ink};">${escapeHtml(
            line
          )}</p>`
        )
        .join("")}
    </div>
  `;
};

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

const sendOrderConfirmationEmail = async ({
  to,
  customerName,
  orderNumber,
  orderDate,
  items,
  subtotal,
  shipping,
  discount,
  total,
  shippingAddress,
}) => {
  const safeCustomerName = String(customerName || "there").trim() || "there";
  const safeOrderNumber = formatOrderNumber(orderNumber);
  const safeOrderDate = formatOrderDate(orderDate);
  const itemRows = Array.isArray(items)
    ? items.map((item) => ({
        name: item.name,
        quantity: Number(item.quantity || 0),
        unitPrice: item.unitPrice,
        lineTotal: Number(item.lineTotal || 0),
      }))
    : [];

  const text = [
    `Thank you for your order, ${safeCustomerName}.`,
    "",
    "Your selection has been received and is now being carefully prepared.",
    "",
    `Order Number: ${safeOrderNumber}`,
    `Date: ${safeOrderDate}`,
    "",
    "Items:",
    ...itemRows.map((item) => `- ${item.name} x${item.quantity} (${formatCurrency(item.lineTotal)})`),
    "",
    `Subtotal: ${formatCurrency(subtotal)}`,
    `Shipping: ${formatCurrency(shipping)}`,
    `Discount: ${formatCurrency(discount)}`,
    `Total: ${formatCurrency(total)}`,
    "",
    "Shipping Address:",
    ...formatShippingAddress(shippingAddress),
    "",
    "We will notify you once your order has been dispatched.",
    "If you have any questions, feel free to reply to this email.",
    "",
    "Not just a scent.",
    "An identity.",
    "",
    "SCNT.eg",
  ].join("\n");

  const bodyHtml = `
    <p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;color:${BRAND.ink};">Thank you for your order, ${escapeHtml(
      safeCustomerName
    )}.</p>
    <p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;color:${BRAND.ink};">Your selection has been received and is now being carefully prepared.</p>
    <p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;color:${BRAND.muted};">At SCNT.eg, every detail matters from composition to delivery. Your fragrance will be handled with precision to ensure it reaches you exactly as intended.</p>
    <div style="margin:18px 0;padding:16px 18px;border:1px solid ${BRAND.border};border-radius:14px;background:linear-gradient(180deg, ${BRAND.bg} 0%, #ffffff 100%);">
      <p style="margin:0 0 12px 0;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:${BRAND.muted};">Order Summary</p>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
        <tr>
          <td style="padding:0 0 10px 0;font-size:13px;line-height:1.6;color:${BRAND.muted};">Order Number</td>
          <td style="padding:0 0 10px 0;font-size:13px;line-height:1.6;color:${BRAND.ink};text-align:right;font-weight:700;">${escapeHtml(
            safeOrderNumber
          )}</td>
        </tr>
        <tr>
          <td style="padding:0 0 10px 0;font-size:13px;line-height:1.6;color:${BRAND.muted};">Date</td>
          <td style="padding:0 0 10px 0;font-size:13px;line-height:1.6;color:${BRAND.ink};text-align:right;font-weight:700;">${escapeHtml(
            safeOrderDate
          )}</td>
        </tr>
      </table>
    </div>
    <div style="margin:0 0 18px 0;">
      <p style="margin:0 0 10px 0;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:${BRAND.muted};">Items</p>
      ${buildOrderItemsHtml(itemRows)}
    </div>
    <div style="margin:0 0 18px 0;padding:16px 18px;border:1px solid ${BRAND.border};border-radius:14px;background:${BRAND.panel};">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
        <tr>
          <td style="padding:0 0 8px 0;font-size:13px;line-height:1.6;color:${BRAND.muted};">Subtotal</td>
          <td style="padding:0 0 8px 0;font-size:13px;line-height:1.6;color:${BRAND.ink};text-align:right;">${escapeHtml(
            formatCurrency(subtotal)
          )}</td>
        </tr>
        <tr>
          <td style="padding:0 0 8px 0;font-size:13px;line-height:1.6;color:${BRAND.muted};">Shipping</td>
          <td style="padding:0 0 8px 0;font-size:13px;line-height:1.6;color:${BRAND.ink};text-align:right;">${escapeHtml(
            formatCurrency(shipping)
          )}</td>
        </tr>
        <tr>
          <td style="padding:0 0 8px 0;font-size:13px;line-height:1.6;color:${BRAND.muted};">Discount</td>
          <td style="padding:0 0 8px 0;font-size:13px;line-height:1.6;color:${BRAND.ink};text-align:right;">${escapeHtml(
            formatCurrency(discount)
          )}</td>
        </tr>
        <tr>
          <td style="padding:10px 0 0 0;font-size:15px;line-height:1.6;color:${BRAND.ink};font-weight:700;border-top:1px solid ${BRAND.border};">Total</td>
          <td style="padding:10px 0 0 0;font-size:15px;line-height:1.6;color:${BRAND.ink};text-align:right;font-weight:700;border-top:1px solid ${BRAND.border};">${escapeHtml(
            formatCurrency(total)
          )}</td>
        </tr>
      </table>
    </div>
    <div style="margin:0 0 18px 0;">
      <p style="margin:0 0 10px 0;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:${BRAND.muted};">Shipping Address</p>
      ${buildAddressHtml(shippingAddress)}
    </div>
    <p style="margin:0 0 12px 0;font-size:15px;line-height:1.7;color:${BRAND.ink};">We will notify you once your order has been dispatched.</p>
    <p style="margin:0 0 20px 0;font-size:15px;line-height:1.7;color:${BRAND.muted};">If you have any questions, feel free to reply to this email.</p>
    <div style="padding:16px 18px;border-radius:14px;background:${BRAND.bg};border:1px solid ${BRAND.border};text-align:center;">
      <p style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;line-height:1.1;color:${BRAND.ink};">Not just a scent.</p>
      <p style="margin:4px 0 0 0;font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;line-height:1.1;color:${BRAND.ink};">An identity.</p>
      <p style="margin:10px 0 0 0;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:${BRAND.muted};">✦ SCNT.eg</p>
    </div>
  `;

  const html = wrapEmailLayout({
    eyebrow: "Order confirmation",
    title: "Your order has been received",
    intro: "We’re preparing your selection with the same attention to detail that shapes every SCNT.eg fragrance.",
    bodyHtml,
    ctaHtml: "",
    footerNote: "Track your account for order updates and dispatch notifications.",
  });

  return sendEmail({ to, subject: `SCNT.eg order confirmation ${safeOrderNumber}`, text, html });
};

module.exports = {
  isMailerConfigured,
  sendEmail,
  sendVerificationEmail,
  sendPromotionalEmail,
  sendOrderConfirmationEmail,
};
