const nodemailer = require("nodemailer");
const config = require("../configs"); // Barrel yapısı sayesinde configs/index.js'e erişir

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: {
    user: config.email.auth.user,
    pass: config.email.auth.pass,
  },
});

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    await transporter.sendMail({
      from: config.email.from,
      to,
      subject,
      text,
      html,
    });
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error("Error sending email:", error);
    // Burada daha gelişmiş bir hata loglama mekanizması kurabilirsiniz.
  }
};

const sendVerificationCode = async (to, code) => {
  const subject = "Your Login Verification Code";
  const text = `Your verification code to log in to the application is: ${code}. This code is valid for 10 minutes.`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; text-align: center;">
      <h2 style="color: #1a1a1a;">Login Verification</h2>
      <p>Please use the code below to log in to your account. This code is valid for 10 minutes.</p>
      <div style="text-align: center; margin: 20px 0;">
        <span style="display: inline-block; font-size: 28px; font-weight: bold; letter-spacing: 5px; padding: 15px 25px; background-color: #f0f0f0; border-radius: 8px; color: #1a1a1a;">
          ${code}
        </span>
      </div>
      <p>If you did not request this code, please secure your account.</p>
    </div>
  `;

  await sendEmail({ to, subject, text, html });
};

module.exports = {
  sendEmail,
  sendVerificationCode,
};

