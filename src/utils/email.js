import nodemailer from "nodemailer";

export const sendInterviewMail = async (candidateName, email, position, interviewDateTime, meetingLink, round) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Format date and time
    const date = new Date(interviewDateTime);
    const formattedDate = date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const formattedTime = date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f0f0f0;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #2a2a2a;
              color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
            }
            .header {
              background-color: #0052cc;
              padding: 30px;
              text-align: center;
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 1px;
            }
            .content {
              padding: 30px;
            }
            .greeting {
              font-size: 16px;
              margin-bottom: 15px;
              font-weight: bold;
            }
            .intro-text {
              font-size: 14px;
              margin-bottom: 25px;
              line-height: 1.6;
            }
            .round-badge {
              color: #0052cc;
              font-weight: bold;
            }
            .details-box {
              background-color: #555555;
              padding: 25px;
              border-radius: 8px;
              margin: 25px 0;
            }
            .details-title {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 15px;
            }
            .detail-row {
              margin-bottom: 12px;
              font-size: 14px;
            }
            .detail-label {
              font-weight: bold;
              display: inline-block;
              width: 100px;
            }
            .meeting-link-text {
              font-size: 12px;
              color: #cccccc;
              margin-top: 10px;
            }
            .button {
              display: inline-block;
              background-color: #0052cc;
              color: #ffffff !important;
              padding: 12px 25px;
              border-radius: 4px;
              text-decoration: none !important;
              font-weight: bold;
              margin-top: 10px;
              font-size: 14px;
              cursor: pointer;
              border: none;
            }
            .button * {
              color: #ffffff !important;
              text-decoration: none !important;
            }
            .guidelines-section {
              margin-top: 25px;
            }
            .guidelines-title {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 15px;
            }
            .guidelines-list {
              padding-left: 20px;
              font-size: 14px;
              line-height: 1.8;
            }
            .guidelines-list li {
              margin-bottom: 10px;
            }
            .footer-message {
              font-size: 14px;
              margin-top: 25px;
              margin-bottom: 20px;
            }
            .signature {
              margin-top: 25px;
              border-top: 1px solid #555555;
              padding-top: 15px;
              font-size: 14px;
              text-align: center;
            }
            .signature-text {
              margin: 5px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header -->
            <div class="header">
              Interview Invitation
            </div>

            <!-- Content -->
            <div class="content">
              <!-- Greeting -->
              <div class="greeting">
                Dear <strong>${candidateName}</strong>,
              </div>

              <!-- Intro Text -->
              <div class="intro-text">
                We are pleased to invite you for the <span class="round-badge">${round}</span> of interview for the position of <strong>${position}</strong>
              </div>

              <!-- Interview Details Box -->
              <div class="details-box">
                <div class="details-title">Interview Details:</div>
                <div class="detail-row">
                  <span class="detail-label">Position:</span> ${position}
                </div>
                <div class="detail-row">
                  <span class="detail-label">Date:</span> ${formattedDate}
                </div>
                <div class="detail-row">
                  <span class="detail-label">Time:</span> ${formattedTime}
                </div>
                <div class="detail-row">
                  <span class="detail-label">Meeting Link:</span>
                  <a href="${meetingLink}" class="button" target="_blank" style="display: inline-block; background-color: #0052cc; color: #ffffff; padding: 12px 25px; border-radius: 4px; text-decoration: none; font-weight: bold; margin-top: 10px; font-size: 14px;">Join Meeting</a>
                  <div class="meeting-link-text">Or copy the link: ${meetingLink}</div>
                </div>
              </div>

              <!-- Preparation Guidelines -->
              <div class="guidelines-section">
                <div class="guidelines-title">Preparation Guidelines:</div>
                <ul class="guidelines-list">
                  <li>Please join the meeting 2 minutes before the scheduled time</li>
                  <li>Ensure you have a stable internet connection</li>
                  <li>Keep your resume and relevant documents ready</li>
                  <li>Choose a quiet and well-lit environment</li>
                  <li>Test your microphone and camera before the interview</li>
                </ul>
              </div>

              <!-- Footer Message -->
              <div class="footer-message">
                We look forward to speaking with you!
              </div>

              <!-- Signature -->
              <div class="signature">
                <div class="signature-text">Best regards,</div>
                <div class="signature-text"><strong>HR Team</strong></div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"HR Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Interview Invitation - ${round} for ${position}`,
      html: htmlTemplate,
    });

    console.log("Email sent successfully to:", email);
    return { success: true };
  } catch (error) {
    console.error("EMAIL ERROR:", error);
    return { success: false, error: error.message };
  }
};
