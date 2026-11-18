/**
 * email.js — Nodemailer wrapper for Job Portal.
 *
 * Accepts:
 *   options.email    — recipient address
 *   options.subject  — email subject
 *   options.html     — (optional) HTML body
 *   options.text     — plain-text body / fallback
 *   options.message  — legacy plain-text field (backward compat)
 *
 * Gmail SMTP requires a 16-character App Password — NOT your regular
 * account password — when 2-Step Verification is enabled:
 *   https://myaccount.google.com/apppasswords
 * Set EMAIL_PASSWORD to the generated App Password in backend/.env
 *
 * Credentials are read from environment variables only; never hard-code them.
 */

"use strict";

const nodemailer = require("nodemailer");

// ── Categorise a Nodemailer / SMTP error for safe logging ───────────────────
// Returns a short label and a human-readable hint without exposing the password.
function classifySmtpError(err) {
  const msg = (err.message || "").toLowerCase();
  const code = err.responseCode || err.code || "";

  if (
    msg.includes("535") ||
    msg.includes("username and password") ||
    msg.includes("bad credentials") ||
    msg.includes("invalid login") ||
    msg.includes("application-specific password") ||
    String(code) === "535"
  ) {
    return {
      category: "AUTH_FAILURE",
      hint:
        "Gmail rejected the SMTP credentials. " +
        "If your Gmail account has 2-Step Verification enabled (which Google now " +
        "enforces for most accounts), you must use a 16-character App Password " +
        "instead of your regular password. " +
        "Generate one at: https://myaccount.google.com/apppasswords " +
        "then set EMAIL_PASSWORD in backend/.env to that App Password.",
    };
  }
  if (
    msg.includes("econnrefused") ||
    msg.includes("enotfound") ||
    msg.includes("etimedout") ||
    msg.includes("connect")
  ) {
    return {
      category: "NETWORK_ERROR",
      hint: `Cannot reach smtp.gmail.com:587. Check your internet connection or firewall. (${err.code || err.message})`,
    };
  }
  if (msg.includes("self signed") || msg.includes("certificate")) {
    return { category: "TLS_ERROR", hint: err.message };
  }
  return { category: "SMTP_ERROR", hint: err.message };
}

let transporter;
let transporterConfig;
let senderMismatchWarningLogged = false;

const normalizeEmailCredential = (value) =>
  String(value ?? "").trim().replace(/\s+/g, "");

const getSmtpConfig = () => {
  const emailUsername = normalizeEmailCredential(process.env.EMAIL_USERNAME);
  const emailPassword = normalizeEmailCredential(process.env.EMAIL_PASSWORD);
  const port = Number(process.env.SMTP_PORT || 587);
  return {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port,
    secure:
      process.env.SMTP_SECURE === undefined
        ? port === 465
        : process.env.SMTP_SECURE.toLowerCase() === "true",
    user: emailUsername,
    pass: emailPassword,
    maxConnections: Number(process.env.SMTP_MAX_CONNECTIONS || 5),
  };
};

const maskSmtpUsername = (username) => {
  if (!username) return "(missing)";
  const separator = username.lastIndexOf("@");
  if (separator <= 0) return `${username[0]}***`;
  return `${username[0]}***${username.slice(separator)}`;
};

const logSmtpConfiguration = (config) => {
  console.info("[email] SMTP configuration:", {
    host: config.host,
    port: config.port,
    secure: config.secure,
    requireTLS: !config.secure,
    pool: true,
    maxConnections: config.maxConnections,
    username: maskSmtpUsername(config.user),
    usernamePresent: Boolean(config.user),
    passwordPresent: Boolean(config.pass),
    credentialsPresent: Boolean(config.user && config.pass),
    normalizedPasswordLength: config.pass.length,
  });
};

const getTransporter = (config = getSmtpConfig()) => {
  const configKey = JSON.stringify(config);

  if (!transporter || configKey !== transporterConfig) {
    if (transporter) transporter.close();
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      requireTLS: !config.secure,
      pool: true,
      maxConnections: config.maxConnections,
      maxMessages: 100,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });
    transporterConfig = configKey;
  }

  return transporter;
};

const logSmtpFailure = (operation, err) => {
  const { category, hint } = classifySmtpError(err);
  console.error(`[email] ${operation} FAILED (${category}):`, {
    message: err.message,
    code: err.code,
    responseCode: err.responseCode,
    command: err.command,
    response: err.response,
    hint,
    stack: err.stack,
  });
};

// ── Validate at module load so the server log shows a clear message on boot ──
// (Non-blocking; does not prevent the server from starting.)
if (process.env.NODE_ENV !== "test") {
  setImmediate(() => {
    const config = getSmtpConfig();
    logSmtpConfiguration(config);
    if (!config.user || !config.pass) {
      console.warn(
        "[email] WARNING: EMAIL_USERNAME or EMAIL_PASSWORD is not set in .env. " +
          "Email delivery will fail until both are configured.",
      );
      return;
    }
    getTransporter(config).verify((err) => {
      if (err) {
        logSmtpFailure("SMTP pre-flight", err);
      } else {
        console.log("[email] SMTP pre-flight OK — transporter is ready.");
      }
    });
  });
}

// ── Main send function ───────────────────────────────────────────────────────
const sendEmail = async (options) => {
  const config = getSmtpConfig();

  // Guard: surface missing config as a clear error rather than an
  // unintelligible Nodemailer stack trace.
  if (!config.user || !config.pass) {
    const configErr = new Error(
      "Email is not configured. Set EMAIL_USERNAME and EMAIL_PASSWORD in backend/.env.",
    );
    configErr.category = "CONFIG_MISSING";
    throw configErr;
  }

  try {
    const activeTransporter = getTransporter(config);
    const authenticatedSender = config.user;
    if (
      process.env.EMAIL_FROM &&
      process.env.EMAIL_FROM.trim().toLowerCase() !==
        authenticatedSender.toLowerCase() &&
      !senderMismatchWarningLogged
    ) {
      console.warn(
        "[email] EMAIL_FROM differs from the authenticated SMTP account; using EMAIL_USERNAME as the sender.",
      );
      senderMismatchWarningLogged = true;
    }
    const mailOptions = {
      from: `"Job Portal" <${authenticatedSender}>`,
      to: options.email,
      subject: options.subject,
      text: options.text || options.message || "",
      ...(options.html ? { html: options.html } : {}),
    };

    return await activeTransporter.sendMail(mailOptions);
  } catch (err) {
    // Attach a category so the caller can log it without re-parsing the message
    const { category, hint } = classifySmtpError(err);
    err.category = category;
    err.hint = hint;
    throw err;
  }
};

module.exports = sendEmail;
