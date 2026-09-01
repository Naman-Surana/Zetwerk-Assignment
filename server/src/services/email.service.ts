import nodemailer from 'nodemailer';

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  private static async getTransporter() {
    if (this.transporter) return this.transporter;

    if (process.env.SMTP_HOST) {
      // Use provided SMTP credentials
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // Create a test account for development if no SMTP is provided
      console.log('No SMTP credentials found. Creating an Ethereal test account...');
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }
    return this.transporter;
  }

  static async sendPasswordResetEmail(toEmail: string, resetLink: string) {
    const transporter = await this.getTransporter();
    
    const mailOptions = {
      from: `"Horizon Bank Support" <${process.env.SMTP_USER || 'surana.naman2004@gmail.com'}>`,
      to: toEmail,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4f46e5; text-align: center;">Horizon Bank</h2>
          <p>We received a request to reset your password. Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
          </div>
          <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
          <p style="color: #666; font-size: 14px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${resetLink}" style="color: #4f46e5;">${resetLink}</a>
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    // Log URL for Ethereal email so it can be previewed locally
    if (!process.env.SMTP_HOST) {
      console.log('----------------------------------------------------');
      console.log('Preview Password Reset Email: %s', nodemailer.getTestMessageUrl(info));
      console.log('----------------------------------------------------');
    }
    
    return info;
  }
}
