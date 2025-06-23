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
  const subject = "Giriş Doğrulama Kodunuz";
  const text = `Uygulamaya giriş yapmak için doğrulama kodunuz: ${code}. Bu kod 10 dakika boyunca geçerlidir.`;
  const html = `
    <div style="font-family: Arial, sans-serif; text-align: center; color: #333;">
      <h2>Giriş Doğrulama</h2>
      <p>Uygulamaya giriş yapmak için aşağıdaki kodu kullanın:</p>
      <p style="font-size: 24px; font-weight: bold; letter-spacing: 5px; background-color: #f0f0f0; padding: 10px; border-radius: 5px;">${code}</p>
      <p>Bu kod 10 dakika boyunca geçerlidir.</p>
      <p>Eğer bu işlemi siz yapmadıysanız, lütfen hesabınızın güvenliğini kontrol edin.</p>
    </div>
  `;

  await sendEmail({ to, subject, text, html });
};

module.exports = {
  sendEmail,
  sendVerificationCode,
};
