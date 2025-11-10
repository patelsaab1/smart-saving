import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();


const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


/**
 * Send a branded SmartSaving email
 * @param {string} to - Receiver email
 * @param {string} subject - Email subject
 * @param {string} otp - OTP code
 */
export const sendEmail = async (to, subject, otp) => {
  const htmlContent = `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color:#f7f9fc; padding:30px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:auto; background:#ffffff; border-radius:12px; border:1px solid #e0e0e0;">
      <tr>
        <td style="padding:30px; text-align:center; border-bottom:1px solid #e0e0e0;">
          <img src="https://ik.imagekit.io/ifxomurowj/smartsavinglogo.png?updatedAt=1759383141114" alt="SmartSaving" width="100" style="display:block; margin:auto;" />
          <h1 style="color:#2c7be5; font-size:24px; margin:10px 0 0;">SmartSaving</h1>
          <p style="color:#555555; font-size:14px; margin:5px 0 0;">बचत भी, कमाई भी 💰</p>
        </td>
      </tr>
      <tr>
        <td style="padding:30px 30px 10px 30px; text-align:center;">
          <h2 style="color:#333333; font-size:20px; margin-bottom:10px;">Your One-Time Password (OTP)</h2>
          <p style="color:#555555; font-size:14px; margin-bottom:20px;">Please use the OTP below to complete your login. This OTP is valid for <b>${process.env.OTP_EXPIRY} minutes</b>.</p>
          <div style="display:inline-block; background:#2c7be5; color:#ffffff; font-size:28px; font-weight:bold; padding:15px 30px; border-radius:8px; letter-spacing:4px;">${otp}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 30px; text-align:left; font-size:14px; color:#555555; line-height:1.6;">
          <p>💡 <b>Note:</b> Do not share this OTP with anyone. SmartSaving will never ask for your OTP outside this email.</p>
          <p>✅ OTP Verification helps keep your account safe and secure.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 30px; text-align:center;">
          <a href="https://smartsavingin.netlify.app" target="_blank" style="display:inline-block; padding:12px 25px; font-size:16px; color:#ffffff; background-color:#2c7be5; border-radius:8px; text-decoration:none;">Go to SmartSaving</a>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 30px; text-align:center; font-size:12px; color:#999999; border-top:1px solid #e0e0e0;">
          This is an automated message. If you did not request this, please ignore this email.<br/>
          © ${new Date().getFullYear()} SmartSaving. All rights reserved.
        </td>
      </tr>
    </table>
  </div>
  `;

  await transporter.sendMail({
    from: `"SmartSaving Support" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: htmlContent,
  });
};



export const sendSmartSavingMail = async (
  to,
  subject = "SmartSaving Notification",
  messageTitle,
  messageBody
) => {

  // Default titles if not provided
  const finalTitle = messageTitle || "SmartSaving Notification";
  const finalBody = messageBody || "This is a confirmation message from SmartSaving.";

  const htmlContent = `
  <div style="font-family: 'Segoe UI', sans-serif; background-color:#f7f9fc; padding:30px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:auto; background:#ffffff; border-radius:12px; border:1px solid #e0e0e0;">

      <tr>
        <td style="padding:30px; text-align:center; border-bottom:1px solid #e0e0e0;">
          <img src="https://ik.imagekit.io/ifxomurowj/smartsavinglogo.png?updatedAt=1759383141114" alt="SmartSaving" width="110" style="display:block; margin:auto;" />
          <h1 style="color:#2c7be5; font-size:22px; margin:8px 0 0;">SmartSaving</h1>
          <p style="color:#555; font-size:14px;">बचत भी, कमाई भी 💰</p>
        </td>
      </tr>

      <tr>
        <td style="padding:30px; text-align:center;">
          <h2 style="color:#333; font-size:20px; margin-bottom:8px;">${finalTitle}</h2>
          <p style="color:#444; font-size:15px; line-height:1.6; margin-bottom:20px;">${finalBody}</p>
        </td>
      </tr>

      <tr>
        <td style="padding:15px 30px; font-size:14px; color:#555;">
          <p>यदि आपको कोई सहायता चाहिए तो कृपया संपर्क करें:</p>
          <p><b>📞 Call / WhatsApp:</b> <a href="tel:6265861847">6265861847</a></p>
        </td>
      </tr>

      <tr>
        <td style="padding:20px 30px; text-align:center;">
          <a href="https://smartsavingin.netlify.app" target="_blank" style="display:inline-block; padding:12px 25px; font-size:16px; color:#ffffff; background-color:#2c7be5; border-radius:8px; text-decoration:none;">Open SmartSaving App</a>
        </td>
      </tr>

      <tr>
        <td style="padding:20px; text-align:center; font-size:12px; color:#999; border-top:1px solid #e0e0e0;">
          © ${new Date().getFullYear()} SmartSaving. All rights reserved.
        </td>
      </tr>

    </table>
  </div>
  `;

  await transporter.sendMail({
    from: `"SmartSaving Support" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: htmlContent,
  });
};




// Reusable HTML Template
export const smartSavingEmailTemplate = (title, body) => `
<div style="font-family: 'Segoe UI', sans-serif; background:#f7f9fc; padding:30px;">
  <table width="100%" cellpadding="0" cellspacing="0" 
    style="max-width:600px; margin:auto; background:#ffffff; border-radius:14px; border:1px solid #e5e7eb;">

    <tr>
      <td style="text-align:center; padding:25px; border-bottom:1px solid #e5e7eb;">
        <img src="https://ik.imagekit.io/ifxomurowj/smartsavinglogo.png" width="100" />
        <h1 style="color:#2563eb; margin:10px 0 0; font-size:22px;">SmartSaving</h1>
        <p style="color:#666; font-size:14px;">बचत भी, कमाई भी 💰</p>
      </td>
    </tr>

    <tr>
      <td style="padding:30px; text-align:left;">
        <h2 style="color:#111827; font-size:19px; margin-bottom:12px;">${title}</h2>
        <p style="color:#374151; font-size:15px; line-height:1.6;">${body}</p>
      </td>
    </tr>

    <tr>
      <td style="padding:10px 30px; font-size:14px; color:#555;">
        <p>यदि आपको सहायता चाहिए, संपर्क करें:</p>
        <p><b>📞 WhatsApp:</b> <a href="https://wa.me/6265861847">6265861847</a></p>
      </td>
    </tr>

    <tr>
      <td style="padding:20px 30px; text-align:center;">
        <a href="https://smartsavingin.netlify.app" target="_blank" 
          style="background:#2563eb; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; font-size:15px;">
          SmartSaving App खोलें
        </a>
      </td>
    </tr>

    <tr>
      <td style="padding:18px; text-align:center; font-size:12px; color:#999; border-top:1px solid #e5e7eb;">
        © ${new Date().getFullYear()} SmartSaving. All Rights Reserved.
      </td>
    </tr>

  </table>
</div>
`;
/**
 * Unified SmartSaving Email Sender
 * @param {string} to - Receiver email
 * @param {string} subject - email subject
 * @param {string} html - Final html content
 */
export const sendSmartSavingMailpayment = async (to, subject, html) => {
  return transporter.sendMail({
    from: `"SmartSaving Support" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};