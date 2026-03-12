import nodemailer from "nodemailer";
import config from "../config/index.js"; // Path update kora lagte pare logic onujayi

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: config.smtp.smtp_host,
    service: config.smtp.smtp_service,
    port: parseInt(config.smtp.smtp_port),
    secure: false, // true for 465, false for other ports
    auth: {
      user: config.smtp.smtp_mail,
      pass: config.smtp.smtp_password,
    },
  });

  const { email, subject, html } = options;

  const mailOptions = {
    from: `"${config.smtp.NAME}" <${config.smtp.smtp_mail}>`,
    to: email,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};

export { sendEmail };