import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER!, // e.g. 8xxxxx@smtp-brevo.com
    pass: process.env.BREVO_SMTP_PASS!, // SMTP key (NOT API key)
  },
});

const SENDER_NAME = "MemeBox";
const SENDER_EMAIL = "naikvbn774@gmail.com";

interface SendEmailParams {
  to: { email: string; name?: string };
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export async function sendTransactionalEmail(params: SendEmailParams) {
  try {
    const info = await transporter.sendMail({
      from: `"${SENDER_NAME}" <${SENDER_EMAIL}>`,
      to: params.to.name
        ? `"${params.to.name}" <${params.to.email}>`
        : params.to.email,
      subject: params.subject,
      text: params.textContent,
      html: params.htmlContent,
    });

    console.log("Email sent →", info.messageId);
    return info;
  } catch (err) {
    console.error("Email send failed:", err);
    throw new Error("Failed to send email");
  }
}