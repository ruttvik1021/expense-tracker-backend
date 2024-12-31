import crypto from 'crypto';
import nodemailer from 'nodemailer';

const generateRandomToken = (): string => {
  return crypto.randomBytes(32).toString('hex'); // Generate a random 32-byte string
};

const TOKEN_EXPIRATION_DURATION = 24 * 60 * 60 * 1000; // 1 day in milliseconds

export const isVerificationCodeExpired = (expirationDate: Date): boolean => {
  return Date.now() > new Date(expirationDate).getTime();
};

const getVerificationLink = (uniqueCode: string) => {
  const url =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : process.env.PROD_URL;
  return `${url}/verify-email/${uniqueCode}`;
};

const signUpTemplate = (link: string) => {
  const url = getVerificationLink(link);
  return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Expense Tracker</title>
        </head>
        <body>
          <h1>Welcome to Expense Tracker</h1>
          <p>We are glad to have you on our platform.</p>
          <p>Click the below link to verify your email:</p>
          <a href="${url}" target='_blank'>${url}</a>
        </body>
        </html>
      `;
};

export const sendVerificationEmail = async ({ to }: { to: string }) => {
  const verificationToken = generateRandomToken(); // Or use JWT method
  const tokenExpiration = new Date(Date.now() + TOKEN_EXPIRATION_DURATION); // 1 day

  const mailOptions = {
    from: 'ExpenseTracker',
    to,
    subject: 'Email verification',
    html: signUpTemplate(verificationToken),
  };

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.NODEMAILER_USER,
      pass: process.env.NODEMAILER_PASS,
    },
  });

  await transporter.sendMail(mailOptions);

  return {
    verificationToken,
    tokenExpiration,
  };
};
