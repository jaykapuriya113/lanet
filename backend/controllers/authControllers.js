const User = require("../models/userModel");
const crypto = require("crypto");
const ErrorResponse = require("../utils/errorResponse");
const sendEmail = require("../utils/email");
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

exports.signup = async (req, res, next) => {
  const { email } = req.body;
  const userExist = await User.findOne({ email });
  if (userExist) {
    return next(new ErrorResponse("E-mail already exist", 400));
  }
  try {
    const userData = { ...req.body, role: Number(req.body.role ?? 0) };
    const user = await User.create(userData);
    res.status(201).json({
      success: true,
      user,
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
    //check user email
    const user = await User.findOne({ email });
    if (!user) {
      return next(new ErrorResponse("invalid credentials", 400));
    }
    // Check if user is deleted
    if (user.isDeleted) {
      return next(new ErrorResponse("User has been deleted", 400));
    }
    //check password
    const isMatched = await user.comparePassword(password);
    user.password = undefined;
    if (!isMatched) {
      return next(new ErrorResponse("invalid credentials", 400));
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

  const resetURL = `http://127.0.0.1:3000/user/resetPassword/${resetToken}`;
  const message = `Hey ${user.name}, \n Forgot your password? Don't Worry :) \n Submit a PATCH request with your new password to: ${resetURL} \n If you didn't forget your password, please ignore this email ! `;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token is only valid for 10 mins!",
      message,
    });

    return res.status(200).json({
      message: "Forgot Password Token sent to email!",
      token: resetToken,
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorResponse({ err }, 500));
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
