const path = require("path");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM || smtpUser;
const allowSelfSigned =
  String(process.env.SMTP_ALLOW_SELF_SIGNED || "").toLowerCase() === "true";

const recipientArg = process.argv[2];
const to = recipientArg || smtpUser;

const required = [
  ["SMTP_USER", smtpUser],
  ["SMTP_PASS", smtpPass],
  ["SMTP_FROM", smtpFrom],
];

const missing = required.filter(([, value]) => !value).map(([key]) => key);
if (missing.length > 0) {
  console.error(`Missing required env vars: ${missing.join(", ")}`);
  process.exit(1);
}

if (!to) {
  console.error("No recipient email found. Pass one as an argument or set SMTP_USER.");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
  tls: allowSelfSigned
    ? {
        rejectUnauthorized: false,
      }
    : undefined,
});

const run = async () => {
  if (allowSelfSigned) {
    console.warn("Warning: SMTP_ALLOW_SELF_SIGNED=true (TLS cert validation disabled).");
  }
  console.log(`Checking SMTP auth on ${smtpHost}:${smtpPort}...`);
  await transporter.verify();
  console.log("SMTP auth verified successfully.");

  console.log(`Sending test email to ${to}...`);
  const info = await transporter.sendMail({
    from: smtpFrom,
    to,
    subject: "SCNT.eg SMTP test email",
    text: `SMTP test succeeded at ${new Date().toISOString()}`,
    html: `<p>SMTP test succeeded at <strong>${new Date().toISOString()}</strong></p>`,
  });

  console.log("Email sent successfully.");
  console.log(`Message ID: ${info.messageId}`);
};

run().catch((error) => {
  console.error("SMTP test failed.");
  console.error(error?.message || error);
  process.exit(1);
});
