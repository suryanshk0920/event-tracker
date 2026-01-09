import nodemailer from 'nodemailer';
import { UserRole } from '../types';

interface EmailCredentials {
    email: string;
    password: string;
    name: string;
    role: UserRole;
}

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    return transporter;
}

/**
 * Sends an email with login credentials to a newly registered user
 * @param credentials - User credentials including email, password, name, and role
 */
export async function sendCredentialsEmail(credentials: EmailCredentials): Promise<void> {
    const { email, password, name, role } = credentials;

    const roleLabel = {
        [UserRole.STUDENT]: 'Student',
        [UserRole.FACULTY]: 'Faculty',
        [UserRole.ORGANIZER]: 'Organizer',
        [UserRole.ADMIN]: 'Administrator',
    }[role];

    const mailOptions = {
        from: `"Event Tracker" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Welcome to Event Tracker - Your Account Credentials',
        html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 10px 10px;
              border: 1px solid #e5e7eb;
              border-top: none;
            }
            .credentials-box {
              background: white;
              border-left: 4px solid #667eea;
              padding: 20px;
              margin: 20px 0;
              border-radius: 5px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .credential-item {
              margin: 10px 0;
              padding: 10px;
              background: #f3f4f6;
              border-radius: 5px;
            }
            .credential-label {
              font-weight: 600;
              color: #4b5563;
              font-size: 14px;
            }
            .credential-value {
              font-family: 'Courier New', monospace;
              color: #1f2937;
              font-size: 16px;
              font-weight: 600;
              margin-top: 5px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: 600;
            }
            .warning {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0;">✨ Welcome to Event Tracker!</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${name}</strong>,</p>
            
            <p>Your account has been created as a <strong>${roleLabel}</strong>. Below are your login credentials:</p>
            
            <div class="credentials-box">
              <div class="credential-item">
                <div class="credential-label">📧 Email Address</div>
                <div class="credential-value">${email}</div>
              </div>
              <div class="credential-item">
                <div class="credential-label">🔑 Temporary Password</div>
                <div class="credential-value">${password}</div>
              </div>
            </div>
            
            <div class="warning">
              <strong>⚠️ Important Security Notice:</strong>
              <p style="margin: 10px 0 0 0;">This is a temporary password. For security reasons, please change your password immediately after your first login by visiting the "Change Password" section in your account settings.</p>
            </div>
            
            <center>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">
                🚀 Login Now
              </a>
            </center>
            
            <p style="margin-top: 30px;">If you have any questions or need assistance, please contact your administrator.</p>
            
            <div class="footer">
              <p>This is an automated message from Event Tracker System.</p>
              <p>Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
        text: `
Welcome to Event Tracker!

Hello ${name},

Your account has been created as a ${roleLabel}. Below are your login credentials:

Email: ${email}
Temporary Password: ${password}

IMPORTANT: This is a temporary password. Please change your password immediately after your first login.

Login at: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login

If you have any questions, please contact your administrator.

---
This is an automated message from Event Tracker System.
    `.trim(),
    };

    try {
        const info = await getTransporter().sendMail(mailOptions);
        console.log('Credentials email sent successfully:', info.messageId);
    } catch (error) {
        console.error('Error sending credentials email:', error);
        throw new Error('Failed to send credentials email');
    }
}

/**
 * Verify SMTP connection
 */
export async function verifyEmailService(): Promise<boolean> {
    try {
        await getTransporter().verify();
        console.log('Email service is ready');
        return true;
    } catch (error) {
        console.error('Email service verification failed:', error);
        return false;
    }
}
