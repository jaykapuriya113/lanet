const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      trim: true,
      required: [true, "first name is require"],
      maxlength: 32,
    },
    lastName: {
      type: String,
      trim: true,
      required: [true, "last name is require"],
      maxlength: 32,
    },
    email: {
      type: String,
      trim: true,
      required: [true, "e-mail is require"],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email",
      ],
    },
    password: {
      type: String,
      trim: true,
      required: [true, "password is required"],
      minlength: [6, "password must have at least (6) caracters"],
    },
    resume: {
      type: String,
      required: [
        function () {
          return Number(this.role) === 0;
        },
        "A user must upload resume",
      ],
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    education: {
      type: String,
      trim: true,
    },
    skills: {
      type: String,
      trim: true,
    },
    experience: {
      type: String,
      trim: true,
    },
    profileInformation: {
      type: String,
      trim: true,
    },
    contactDetails: {
      type: String,
      trim: true,
    },
    profilePhoto: {
      type: String,
      required: [true, "A user must have profile photo"],
    },
    // companyName — optional, stored on recruiter accounts
    companyName: {
      type: String,
      trim: true,
      default: "",
    },
    // companyWebsite — optional URL for the recruiter's company
    companyWebsite: {
      type: String,
      trim: true,
      default: "",
    },
    // companyAddress — optional physical address / location for the company
    companyAddress: {
      type: String,
      trim: true,
      default: "",
    },
    jobsHistory: [{ type: ObjectId, ref: "UserHistory" }],
    role: {
      type: Number,
      default: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    // Soft-disable without permanent deletion. false = deactivated (cannot log in).
    isActive: {
      type: Boolean,
      default: true,
    },
    // Recruiter-only: pending | verified | rejected
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    // Email verification (registration code). Accounts created before this
    // feature have no value here and are treated as verified.
    isEmailVerified: {
      type: Boolean,
    },
    emailVerificationCode: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    emailVerificationAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    emailVerificationSentAt: {
      type: Date,
      select: false,
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  },
);

userSchema.pre("save", async function (next) {
  this.role = Number(this.role ?? 0);

  // Only run this function if password was actually modified
  if (!this.isModified("password")) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

//compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
// return JWT token
userSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE_IN || "7d",
  });
};

userSchema.virtual("userAppliedForJob", {
  ref: "UserHistory",
  localField: "_id",
  foreignField: "user",
});

const User = new mongoose.model("User", userSchema);
module.exports = User;
