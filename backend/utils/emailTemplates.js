/**
 * emailTemplates.js
 *
 * Generates mobile-responsive HTML emails + plain-text alternatives for
 * every transactional event in the Job Portal.
 *
 * Design principles
 * ─────────────────
 * • Single-column layout, max-width 600 px, collapses cleanly on mobile.
 * • Table-based layout for widest email-client compatibility (Gmail, Outlook,
 *   Apple Mail, mobile apps).
 * • Inline CSS only — no <style> blocks that Outlook or Gmail strips.
 * • All links are absolute, constructed from APP_URL env var.
 * • Plain-text body provided on every email so it degrades gracefully.
 * • No credentials or secrets are referenced here.
 */

"use strict";

const APP_URL = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");

// ── palette ───────────────────────────────────────────────────────────────────
const C = {
  brand:    "#2196F3",   // Sky Blue
  brandDark:"#1689D5",
  bg:       "#F0F8FF",
  white:    "#FFFFFF",
  text:     "#263238",
  muted:    "#546E7A",
  border:   "#BBDEFB",
  success:  "#2E7D32",
  warning:  "#E65100",
  info:     "#1565C0",
};

// ── shared wrappers ───────────────────────────────────────────────────────────

/**
 * Wraps arbitrary inner HTML in the standard email chrome:
 * header (logo + title) → body content → footer.
 */
function wrapEmail(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>${escHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${C.bg};font-family:Arial,Helvetica,sans-serif;">
  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background-color:${C.bg};min-height:100%;">
    <tr>
      <td align="center" style="padding:24px 16px;">

        <!-- Card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
               style="max-width:600px;width:100%;background-color:${C.white};border-radius:10px;
                      overflow:hidden;border:1px solid ${C.border};">

          <!-- Header -->
          <tr>
            <td align="center"
                style="background-color:${C.brand};padding:28px 24px 22px;">
              <span style="font-family:monospace;font-size:22px;font-weight:700;
                           letter-spacing:3px;color:${C.white};">JOB PORTAL</span>
            </td>
          </tr>

          <!-- Title bar -->
          <tr>
            <td style="background-color:${C.brandDark};padding:12px 24px;">
              <p style="margin:0;font-size:15px;font-weight:600;color:${C.white};">
                ${escHtml(title)}
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 24px 20px;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:${C.bg};padding:16px 24px;
                       border-top:1px solid ${C.border};">
              <p style="margin:0;font-size:12px;color:${C.muted};line-height:1.6;">
                This email was sent by <strong>Job Portal</strong>.
                If you did not expect this email, you can safely ignore it.<br/>
                &copy; ${new Date().getFullYear()} Job Portal. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Returns a prominent CTA button rendered as a table so it works in Outlook. */
function ctaButton(label, url, color = C.brand) {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0"
       style="margin:20px 0;">
  <tr>
    <td align="center" bgcolor="${color}"
        style="border-radius:8px;background-color:${color};">
      <a href="${escHtml(url)}"
         style="display:inline-block;padding:13px 28px;font-size:15px;
                font-weight:700;color:#ffffff;text-decoration:none;
                border-radius:8px;font-family:Arial,sans-serif;">
        ${escHtml(label)}
      </a>
    </td>
  </tr>
</table>`;
}

/** A grey info-box for highlighting key details. */
function infoBox(rows) {
  const rowsHtml = rows
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:6px 0;font-size:14px;color:${C.muted};
                   font-weight:600;width:38%;vertical-align:top;">
          ${escHtml(label)}
        </td>
        <td style="padding:6px 0 6px 12px;font-size:14px;color:${C.text};
                   vertical-align:top;">
          ${value /* may contain safe HTML like <a> tags */}
        </td>
      </tr>`,
    )
    .join("");

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
       style="background-color:${C.bg};border-radius:8px;
              border:1px solid ${C.border};margin:16px 0;">
  <tr>
    <td style="padding:16px 18px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${rowsHtml}
      </table>
    </td>
  </tr>
</table>`;
}

/** Simple escape for values placed inside HTML attributes / text nodes. */
function escHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Safe absolute link — escapes display text, encodes href. */
function safeLink(label, href) {
  return `<a href="${escHtml(href)}"
     style="color:${C.brand};font-weight:600;word-break:break-all;">${escHtml(label)}</a>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1.  Application status update
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_META = {
  pending:      { label: "Applied",     color: C.info,    icon: "📥" },
  under_review: { label: "Under Review",color: C.info,    icon: "🔍" },
  shortlisted:  { label: "Shortlisted", color: C.success, icon: "⭐" },
  interview:    { label: "Interview",   color: C.success, icon: "🎙️" },
  selected:     { label: "Selected",    color: C.success, icon: "✅" },
  accepted:     { label: "Accepted",    color: C.success, icon: "🎉" },
  rejected:     { label: "Rejected",    color: C.warning, icon: "❌" },
};

/**
 * @param {object} opts
 * @param {string} opts.candidateName
 * @param {string} opts.jobTitle
 * @param {string} opts.companyName
 * @param {string} opts.applicationStatus  — raw status key
 * @param {string} opts.applicationId
 * @returns {{ subject, html, text }}
 */
function applicationStatusEmail(opts) {
  const { candidateName, jobTitle, companyName, applicationStatus, applicationId } = opts;
  const meta = STATUS_META[applicationStatus] || { label: applicationStatus, color: C.info, icon: "ℹ️" };
  const subject = `${meta.icon} Application ${meta.label} — ${jobTitle} at ${companyName}`;
  const detailUrl = `${APP_URL}/user/jobs`;

  const html = wrapEmail(subject, `
    <p style="margin:0 0 16px;font-size:16px;color:${C.text};">
      Hi <strong>${escHtml(candidateName)}</strong>,
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:${C.text};line-height:1.65;">
      Your application status has been updated to
      <strong style="color:${meta.color};">${escHtml(meta.label)}</strong>.
    </p>

    ${infoBox([
      ["Job Title",    escHtml(jobTitle)],
      ["Company",      escHtml(companyName)],
      ["New Status",   `<strong style="color:${meta.color};">${escHtml(meta.label)}</strong>`],
      ["Application",  safeLink("View Application", detailUrl)],
    ])}

    ${meta.label === "Rejected"
      ? `<p style="margin:16px 0 0;font-size:14px;color:${C.muted};line-height:1.6;">
           Don't be discouraged — keep applying! There are many opportunities waiting for you.
         </p>`
      : ""}

    ${ctaButton("View Application Details", detailUrl)}

    <p style="margin:16px 0 0;font-size:13px;color:${C.muted};">
      Log in to your Job Portal account to see the full timeline and next steps.
    </p>
  `);

  const text = [
    `Hi ${candidateName},`,
    "",
    `Your application status for ${jobTitle} at ${companyName} has been updated to: ${meta.label}.`,
    "",
    `View your application: ${detailUrl}`,
    "",
    "— Job Portal",
  ].join("\n");

  return { subject, html, text };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2.  Interview invitation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {object} opts
 * @param {string}  opts.candidateName
 * @param {string}  opts.jobTitle
 * @param {string}  opts.companyName
 * @param {string}  opts.interviewDate   — YYYY-MM-DD
 * @param {string}  opts.interviewTime   — HH:MM
 * @param {string}  opts.meetingLink
 * @param {boolean} [opts.rescheduled]
 * @param {string}  opts.applicationId
 * @returns {{ subject, html, text }}
 */
function interviewInvitationEmail(opts) {
  const {
    candidateName, jobTitle, companyName,
    interviewDate, interviewTime, meetingLink,
    rescheduled = false, applicationId,
  } = opts;

  const formattedDate = formatDate(interviewDate);
  const formattedTime = formatTime(interviewTime);
  const detailUrl = `${APP_URL}/user/jobs`;

  const action = rescheduled ? "Rescheduled" : "Scheduled";
  const subject = `🎙️ Interview ${action} — ${jobTitle} at ${companyName}`;

  const html = wrapEmail(subject, `
    <p style="margin:0 0 16px;font-size:16px;color:${C.text};">
      Hi <strong>${escHtml(candidateName)}</strong>,
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:${C.text};line-height:1.65;">
      ${rescheduled
        ? `Your interview has been <strong>rescheduled</strong>.`
        : `You have been invited for an <strong>online interview</strong>.`}
      Please review the details below.
    </p>

    ${infoBox([
      ["Job Title",   escHtml(jobTitle)],
      ["Company",     escHtml(companyName)],
      ["Date",        `<strong>${escHtml(formattedDate)}</strong>`],
      ["Time",        `<strong>${escHtml(formattedTime)}</strong>`],
      ["Mode",        "Online (video call)"],
      ["Meeting Link", safeLink(meetingLink, meetingLink)],
    ])}

    ${ctaButton("Join Meeting", meetingLink, C.success)}

    ${ctaButton("View Application", detailUrl, C.brand)}

    <p style="margin:16px 0 0;font-size:13px;color:${C.muted};line-height:1.6;">
      Please accept or decline this interview from your Job Portal account before the interview date.
    </p>
  `);

  const text = [
    `Hi ${candidateName},`,
    "",
    rescheduled
      ? `Your interview for ${jobTitle} at ${companyName} has been rescheduled.`
      : `You have been invited for an online interview for ${jobTitle} at ${companyName}.`,
    "",
    `Date:         ${formattedDate}`,
    `Time:         ${formattedTime}`,
    `Mode:         Online`,
    `Meeting Link: ${meetingLink}`,
    "",
    `View application: ${detailUrl}`,
    "",
    "— Job Portal",
  ].join("\n");

  return { subject, html, text };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3.  Application deadline reminder
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {object} opts
 * @param {string} opts.candidateName
 * @param {string} opts.jobTitle
 * @param {string} opts.companyName
 * @param {string} opts.deadlineDate     — YYYY-MM-DD string
 * @param {number} opts.daysLeft         — 0, 1, or 3
 * @param {string} opts.jobId
 * @returns {{ subject, html, text }}
 */
function deadlineReminderEmail(opts) {
  const { candidateName, jobTitle, companyName, deadlineDate, daysLeft, jobId } = opts;
  const jobUrl  = `${APP_URL}/job/${jobId}`;
  const applyUrl = `${APP_URL}/job/${jobId}`;

  const urgency =
    daysLeft === 0 ? "TODAY" :
    daysLeft === 1 ? "TOMORROW" :
    `in ${daysLeft} days`;

  const subject = `⏰ Application deadline ${urgency} — ${jobTitle} at ${companyName}`;

  const html = wrapEmail(subject, `
    <p style="margin:0 0 16px;font-size:16px;color:${C.text};">
      Hi <strong>${escHtml(candidateName)}</strong>,
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:${C.text};line-height:1.65;">
      This is a reminder that the application deadline for the position below
      is <strong style="color:${C.warning};">${escHtml(urgency)}</strong>.
    </p>

    ${infoBox([
      ["Job Title",  escHtml(jobTitle)],
      ["Company",    escHtml(companyName)],
      ["Deadline",   `<strong style="color:${C.warning};">${escHtml(deadlineDate)}</strong>`],
      ["Job Link",   safeLink("View Job", jobUrl)],
    ])}

    ${ctaButton("Apply Now", applyUrl, C.warning)}

    <p style="margin:16px 0 0;font-size:13px;color:${C.muted};line-height:1.6;">
      Don't miss this opportunity — apply before the deadline closes.
    </p>
  `);

  const text = [
    `Hi ${candidateName},`,
    "",
    `Reminder: The application deadline for ${jobTitle} at ${companyName} is ${urgency} (${deadlineDate}).`,
    "",
    `Apply here: ${applyUrl}`,
    "",
    "— Job Portal",
  ].join("\n");

  return { subject, html, text };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4.  Password reset
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {object} opts
 * @param {string} opts.name
 * @param {string} opts.resetToken   — raw (unhashed) token
 * @returns {{ subject, html, text }}
 */
function passwordResetEmail(opts) {
  const { name, resetToken } = opts;
  const resetUrl = `${APP_URL}/user/resetPassword/${resetToken}`;
  const subject = "🔑 Reset Your Job Portal Password";

  const html = wrapEmail(subject, `
    <p style="margin:0 0 16px;font-size:16px;color:${C.text};">
      Hi <strong>${escHtml(name)}</strong>,
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:${C.text};line-height:1.65;">
      We received a request to reset your password. Click the button below to
      choose a new password. This link is valid for <strong>10 minutes</strong>.
    </p>

    ${ctaButton("Reset My Password", resetUrl)}

    <p style="margin:16px 0 0;font-size:13px;color:${C.muted};line-height:1.6;">
      If you did not request a password reset, ignore this email — your password
      will not change.
    </p>
  `);

  const text = [
    `Hi ${name},`,
    "",
    "Reset your Job Portal password using the link below.",
    "This link is valid for 10 minutes.",
    "",
    resetUrl,
    "",
    "If you did not request this, ignore this email.",
    "",
    "— Job Portal",
  ].join("\n");

  return { subject, html, text };
}

/**
 * Registration email verification code (user + recruiter).
 * opts: { name, code, expiresInMinutes }
 */
function emailVerificationCodeEmail(opts) {
  const { name, code, expiresInMinutes = 10 } = opts;
  const subject = "Your Job Portal verification code";

  const html = wrapEmail(subject, `
    <p style="margin:0 0 16px;font-size:16px;color:${C.text};">
      Hi <strong>${escHtml(name)}</strong>,
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:${C.text};line-height:1.65;">
      Thanks for registering on Job Portal. Use the code below to verify your
      email address. This code is valid for <strong>${escHtml(expiresInMinutes)} minutes</strong>.
    </p>
    <p style="margin:24px 0;text-align:center;">
      <span style="display:inline-block;padding:14px 28px;font-size:30px;font-weight:bold;
                   letter-spacing:8px;color:${C.brandDark};background-color:${C.bg};
                   border:1px solid ${C.border};border-radius:8px;">
        ${escHtml(code)}
      </span>
    </p>
    <p style="margin:16px 0 0;font-size:13px;color:${C.muted};line-height:1.6;">
      If you did not create an account, ignore this email.
    </p>
  `);

  const text = [
    `Hi ${name},`,
    "",
    `Your Job Portal verification code is: ${code}`,
    `This code is valid for ${expiresInMinutes} minutes.`,
    "",
    "If you did not create an account, ignore this email.",
    "",
    "— Job Portal",
  ].join("\n");

  return { subject, html, text };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(yyyymmdd) {
  try {
    const [y, m, d] = yyyymmdd.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
    });
  } catch {
    return yyyymmdd;
  }
}

function formatTime(hhmm) {
  try {
    const [h, min] = hhmm.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(min).padStart(2, "0")} ${suffix}`;
  } catch {
    return hhmm;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5.  Application confirmation (sent to applicant on successful apply)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {object} opts
 * @param {string} opts.candidateName
 * @param {string} opts.jobTitle
 * @param {string} opts.companyName
 * @param {string} opts.applicationDate   — ISO string or readable date
 * @param {string} opts.applicationId
 * @returns {{ subject, html, text }}
 */
function applicationConfirmationEmail(opts) {
  const { candidateName, jobTitle, companyName, applicationDate, applicationId } = opts;
  const subject = `✅ Application Received — ${jobTitle} at ${companyName}`;
  const detailUrl = `${APP_URL}/user/jobs`;
  const dateStr = applicationDate
    ? new Date(applicationDate).toLocaleDateString("en-GB", {
        day: "numeric", month: "long", year: "numeric",
      })
    : new Date().toLocaleDateString("en-GB", {
        day: "numeric", month: "long", year: "numeric",
      });

  const html = wrapEmail(subject, `
    <p style="margin:0 0 16px;font-size:16px;color:${C.text};">
      Hi <strong>${escHtml(candidateName)}</strong>,
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:${C.text};line-height:1.65;">
      Great news — your application has been <strong>successfully submitted</strong>.
      The recruiter will review it and update you on the next steps.
    </p>

    ${infoBox([
      ["Job Title",        escHtml(jobTitle)],
      ["Company",          escHtml(companyName)],
      ["Applied On",       escHtml(dateStr)],
      ["Status",           `<strong style="color:${C.info};">Applied</strong>`],
      ["Your Application", safeLink("View Application", detailUrl)],
    ])}

    ${ctaButton("Track My Application", detailUrl)}

    <p style="margin:16px 0 0;font-size:13px;color:${C.muted};line-height:1.6;">
      You can check the status of your application at any time by logging in to
      your Job Portal account.
    </p>
  `);

  const text = [
    `Hi ${candidateName},`,
    "",
    `Your application for ${jobTitle} at ${companyName} has been received.`,
    `Applied on: ${dateStr}`,
    `Status: Applied`,
    "",
    `Track your application: ${detailUrl}`,
    "",
    "— Job Portal",
  ].join("\n");

  return { subject, html, text };
}

// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
  applicationStatusEmail,
  interviewInvitationEmail,
  deadlineReminderEmail,
  passwordResetEmail,
  applicationConfirmationEmail,
  emailVerificationCodeEmail,
};
