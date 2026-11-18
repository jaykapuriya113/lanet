const User = require("../models/userModel");
const crypto = require("crypto");
const ErrorResponse = require("../utils/errorResponse");
const sendEmail = require("../utils/email");
const {
  passwordResetEmail,
  emailVerificationCodeEmail,
} = require("../utils/emailTemplates");
const jwt = require("jsonwebtoken");
const UserHistory = require("../models/jobHistory");
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE_IN,
  });
};

// generates a random token for forgot password functionality
const generateToken = () => {
  return crypto.randomBytes(32).toString("hex");
};
// hashes the same token for reset password functionality
const hashToken = (token) => {
  const sha256 = crypto.createHash("sha256");
  sha256.update(token);
  return sha256.digest("hex");
};

// ── Email verification code helpers ─────────────────────────────────────────
const VERIFICATION_CODE_TTL_MINUTES = 10;
const VERIFICATION_MAX_ATTEMPTS = 5;
const VERIFICATION_RESEND_COOLDOWN_MS = 60 * 1000;

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Case-insensitive exact match so "Alex@x.com" and "alex@x.com" are the same account
const findUserByEmail = (email) =>
  User.findOne({ email: new RegExp(`^${escapeRegex(normalizeEmail(email))}$`, "i") });

const generateVerificationCode = () =>
  String(crypto.randomInt(100000, 1000000));

// Stores a fresh hashed code on the user and emails the plain code.
// Throws (with err.category / err.hint from utils/email) if delivery fails.
const issueVerificationCode = async (user) => {
  const code = generateVerificationCode();
  user.emailVerificationCode = hashToken(code);
  user.emailVerificationExpires = new Date(
    Date.now() + VERIFICATION_CODE_TTL_MINUTES * 60 * 1000,
  );
  user.emailVerificationAttempts = 0;
  user.emailVerificationSentAt = new Date();
  await user.save({ validateBeforeSave: false });

  const name =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
  const { subject, html, text } = emailVerificationCodeEmail({
    name,
    code,
    expiresInMinutes: VERIFICATION_CODE_TTL_MINUTES,
  });
  await sendEmail({ email: user.email, subject, html, text });
};

const logVerificationEmailFailure = (err) => {
  console.error(
    `[emailVerification] Email delivery failed (${err.category || "SMTP_ERROR"}): ${err.hint || err.message}`,
  );
};

exports.signup = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!email) {
      return next(new ErrorResponse("please add an email", 400));
    }
    const role = Number(req.body.role ?? 0);
    if (![0, 1].includes(role)) {
      return next(new ErrorResponse("Invalid role", 400));
    }

    const userData = {
      ...req.body,
      email,
      role,
      // Recruiters always start as pending regardless of what the client sends
      verificationStatus: role === 1 ? "pending" : undefined,
      // Only store companyName for recruiters
      companyName: role === 1 ? (req.body.companyName || "").trim() : undefined,
    };
    // Never let the client set verification/security fields
    [
      "isEmailVerified",
      "emailVerificationCode",
      "emailVerificationExpires",
      "emailVerificationAttempts",
      "emailVerificationSentAt",
      "passwordResetToken",
      "passwordResetExpires",
      "isActive",
      "isDeleted",
      "jobsHistory",
      "_id",
    ].forEach((field) => delete userData[field]);

    let user = await findUserByEmail(email);
    if (user && user.isEmailVerified !== false) {
      return next(new ErrorResponse("E-mail already exist", 400));
    }

    if (user) {
      // Previously registered but never verified — refresh details and resend
      user.set(userData);
      user.isEmailVerified = false;
      await user.save();
    } else {
      user = await User.create({ ...userData, isEmailVerified: false });
    }

    let emailSent = true;
    try {
      await issueVerificationCode(user);
    } catch (err) {
      emailSent = false;
      logVerificationEmailFailure(err);
    }

    return res.status(201).json({
      success: true,
      email: user.email,
      emailSent,
      message: emailSent
        ? "Registration successful. A verification code has been sent to your email."
        : "Registration successful, but we could not send the verification code. Please use 'Resend code'.",
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/verify-email  { email, code }
exports.verifyEmail = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const code = String(req.body.code || "").trim();
    if (!email || !/^\d{6}$/.test(code)) {
      return next(new ErrorResponse("Please enter the 6-digit code", 400));
    }

    const user = await findUserByEmail(email).select(
      "+emailVerificationCode +emailVerificationExpires +emailVerificationAttempts",
    );
    if (!user) {
      return next(new ErrorResponse("Invalid email or code", 400));
    }
    if (user.isEmailVerified !== false) {
      return res.status(200).json({
        success: true,
        message: "Email is already verified. Please log in.",
      });
    }
    if (
      !user.emailVerificationCode ||
      !user.emailVerificationExpires ||
      user.emailVerificationExpires.getTime() < Date.now()
    ) {
      return next(
        new ErrorResponse("Code has expired. Please request a new code.", 400),
      );
    }
    if ((user.emailVerificationAttempts || 0) >= VERIFICATION_MAX_ATTEMPTS) {
      return next(
        new ErrorResponse(
          "Too many wrong attempts. Please request a new code.",
          429,
        ),
      );
    }

    const expected = Buffer.from(user.emailVerificationCode, "hex");
    const received = Buffer.from(hashToken(code), "hex");
    const matches =
      expected.length === received.length &&
      crypto.timingSafeEqual(expected, received);

    if (!matches) {
      user.emailVerificationAttempts = (user.emailVerificationAttempts || 0) + 1;
      await user.save({ validateBeforeSave: false });
      return next(new ErrorResponse("Invalid verification code", 400));
    }

    user.isEmailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpires = undefined;
    user.emailVerificationAttempts = 0;
    user.emailVerificationSentAt = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: "Email verified successfully. You can now log in.",
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/resend-verification  { email }
exports.resendVerificationCode = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!email) {
      return next(new ErrorResponse("please add an email", 400));
    }

    const user = await findUserByEmail(email).select("+emailVerificationSentAt");
    if (!user) {
      return next(new ErrorResponse("Email is not registered yet", 404));
    }
    if (user.isEmailVerified !== false) {
      return res.status(200).json({
        success: true,
        message: "Email is already verified. Please log in.",
      });
    }
    if (
      user.emailVerificationSentAt &&
      Date.now() - user.emailVerificationSentAt.getTime() <
        VERIFICATION_RESEND_COOLDOWN_MS
    ) {
      return next(
        new ErrorResponse("Please wait a minute before requesting a new code.", 429),
      );
    }

    try {
      await issueVerificationCode(user);
    } catch (err) {
      logVerificationEmailFailure(err);
      return next(
        new ErrorResponse(
          "Could not send the verification email. Please try again later.",
          500,
        ),
      );
    }

    return res.status(200).json({
      success: true,
      message: "A new verification code has been sent to your email.",
    });
  } catch (error) {
    next(error);
  }
};

exports.signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return next(new ErrorResponse("please add an email", 403));
    }
    if (!password) {
      return next(new ErrorResponse("please add a password", 403));
    }
    //check user email (case-insensitive)
    const user = await findUserByEmail(email);
    if (!user) {
      return next(new ErrorResponse("invalid credentials", 400));
    }
    // Check if user is deleted
    if (user.isDeleted) {
      return next(new ErrorResponse("invalid credentials", 400));
    }
    // Check if user is deactivated by admin
    if (user.isActive === false) {
      return next(new ErrorResponse("Your account has been deactivated. Please contact support.", 403));
    }
    //check password
    const isMatched = await user.comparePassword(password);
    user.password = undefined;
    if (!isMatched) {
      return next(new ErrorResponse("invalid credentials", 400));
    }
    // Only accounts created with the verification flow have false here;
    // older accounts (undefined) keep working.
    if (user.isEmailVerified === false) {
      return res.status(403).json({
        success: false,
        error: "Please verify your email before logging in.",
        needsEmailVerification: true,
        email: user.email,
      });
    }
    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};
const sendTokenResponse = async (user, codeStatus, res) => {
  const token = await user.getJwtToken();
  res
    .status(codeStatus)
    .cookie("token", token, { maxAge: 60 * 60 * 100000 })
    .json({ success: true, role: user, token });
};

// log out
exports.logout = (req, res, next) => {
  res.clearCookie("token");
  res.status(200).json({
    success: true,
    message: "logged out",
  });
};

// user profile
exports.userProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate({
        path: "jobsHistory",
        options: { sort: { createdAt: -1 } },
      });

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// sends a email with a token for authentication to change password
exports.forgotPassword = async (req, res, next) => {
  console.log(req.body);
  const email = req.body.email;
  console.log(email);
  if (!email) return next(new ErrorResponse("Email field is compulsary", 403));

  const user = await User.findOne({ email });
  if (!user) return next(new ErrorResponse("Email is not registered yet", 403));

  const resetToken = generateToken();
  const tokenDB = hashToken(resetToken);
  await user.updateOne({
    passwordResetToken: tokenDB,
  });

  try {
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
    const { subject, html, text } = passwordResetEmail({ name, resetToken });
    await sendEmail({ email: user.email, subject, html, text });

    return res.status(200).json({
      message: "Password reset link sent to your email address.",
      token: resetToken,
    });
  } catch (err) {
    // Always clear the token so the failed attempt cannot be replayed
    user.passwordResetToken = undefined;
    await user.save({ validateBeforeSave: false });

    // Log the category + hint without leaking the password or token
    const category = err.category || "SMTP_ERROR";
    const hint     = err.hint     || err.message || "unknown error";
    console.error(`[forgotPassword] Email delivery failed (${category}): ${hint}`);

    // Return a safe, user-facing message that varies by failure category
    let clientMessage =
      "Could not send the password reset email. Please try again later.";
    if (category === "AUTH_FAILURE") {
      // This is a server misconfiguration — tell the admin, not the user
      clientMessage =
        "Email service is temporarily unavailable. Please contact support.";
    } else if (category === "CONFIG_MISSING") {
      clientMessage =
        "Email is not configured on this server. Please contact the administrator.";
    }

    return next(new ErrorResponse(clientMessage, 500));
  }
};

// checks forgotpassword token and then resets password
exports.resetPassword = async (req, res, next) => {
  const { password, passwordConfirm } = req.body;

  if (!password.newPassword || !passwordConfirm.confirmPassword) {
    return next(
      new ErrorResponse(
        "Both password & passwordConfirm fields are neccessary",
      ),
    );
  }
  console.log("I was here");
  if (password.newPassword !== passwordConfirm.confirmPassword) {
    return next(
      new ErrorResponse("Password and password fields are not the same", 400),
    );
  }
  console.log("I was here");
  const token = req.params.token;
  if (token == "null") {
    return next(
      new ErrorResponse("Token not present, click forgot password again", 403),
    );
  }

  const hashedToken = hashToken(token);
  const user = await User.findOne({ passwordResetToken: hashedToken });
  if (!user) {
    return next(
      new ErrorResponse(
        "Reset Token must have expired, please click forgot password again",
        401,
      ),
    );
  }

  user.password = password.newPassword;
  user.passwordResetToken = undefined;
  const created = await user.save();
  if (created) {
    res.status(200).json({
      message: "Password successfully changed",
    });
  } else {
    return next(new ErrorResponse("Something went wrong", 500));
  }
};
