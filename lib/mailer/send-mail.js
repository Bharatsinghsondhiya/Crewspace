import nodemailer from 'nodemailer';

async function main() {
  const to = process.argv[2];
  const subject = process.argv[3];
  const html = process.argv[4];

  if (!to || !subject || !html) {
    console.error('Usage: node send-mail.js <to> <subject> <html>');
    process.exit(1);
  }

  let transporter;
  let fromEmail;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM;

  if (smtpHost && smtpUser && smtpPass) {
    if (smtpHost.toLowerCase() === 'smtp.gmail.com') {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    } else {
      transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    }
    fromEmail = smtpFrom || smtpUser;
  } else {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    console.log('No SMTP configuration found. Creating an Ethereal test account...');
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user, // generated ethereal user
          pass: testAccount.pass, // generated ethereal password
        },
      });
      fromEmail = '"Access Control Hub Support" <support@example.com>';
    } catch (err) {
      console.error('Failed to create Ethereal test account:', err);
      process.exit(1);
    }
  }

  const mailOptions = {
    from: fromEmail,
    to: to,
    subject: subject,
    html: html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('MESSAGE_SENT_SUCCESSFULLY');
    console.log('Message ID:', info.messageId);
    if (!smtpHost) {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error('Error sending email:', error);
    process.exit(1);
  }
}

main();
