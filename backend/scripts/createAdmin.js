/**
 * One-time CLI script to create the first admin account (role=2).
 *
 * Usage:
 *   node scripts/createAdmin.js
 *
 * Reads credentials from environment variables:
 *   ADMIN_FIRST_NAME   – required
 *   ADMIN_LAST_NAME    – required
 *   ADMIN_EMAIL        – required
 *   ADMIN_PASSWORD     – required (min 6 chars)
 *
 * Set them in backend/.env before running.
 * Password is hashed via the existing bcryptjs pre-save hook on the User model.
 * Exits with code 1 on any error.
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const User = require("../models/userModel");

const {
  ADMIN_FIRST_NAME,
  ADMIN_LAST_NAME,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  DATABASE,
} = process.env;

// Validate required env vars
const missing = [];
if (!ADMIN_FIRST_NAME) missing.push("ADMIN_FIRST_NAME");
if (!ADMIN_LAST_NAME)  missing.push("ADMIN_LAST_NAME");
if (!ADMIN_EMAIL)      missing.push("ADMIN_EMAIL");
if (!ADMIN_PASSWORD)   missing.push("ADMIN_PASSWORD");

if (missing.length) {
  console.error(`[createAdmin] Missing required environment variables: ${missing.join(", ")}`);
  console.error("Add them to backend/.env and retry.");
  process.exit(1);
}

if (ADMIN_PASSWORD.length < 6) {
  console.error("[createAdmin] ADMIN_PASSWORD must be at least 6 characters.");
  process.exit(1);
}

(async () => {
  try {
    await mongoose.connect(DATABASE, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("[createAdmin] Connected to database.");

    // Prevent duplicate admin creation
    const existing = await User.findOne({ email: ADMIN_EMAIL });
    if (existing) {
      console.error(
        `[createAdmin] A user with email "${ADMIN_EMAIL}" already exists (role=${existing.role}). Aborting.`
      );
      process.exit(1);
    }

    // Create admin — password hashed by userSchema pre-save hook
    const admin = await User.create({
      firstName: ADMIN_FIRST_NAME.trim(),
      lastName:  ADMIN_LAST_NAME.trim(),
      email:     ADMIN_EMAIL.trim().toLowerCase(),
      password:  ADMIN_PASSWORD,
      role:      2,
      // profilePhoto required by schema — use a placeholder for admin accounts
      profilePhoto: "admin",
    });

    console.log("✅ Admin account created successfully.");
    console.log(`   Name  : ${admin.firstName} ${admin.lastName}`);
    console.log(`   Email : ${admin.email}`);
    console.log(`   Role  : ${admin.role} (MainAdmin)`);
    console.log(`   ID    : ${admin._id}`);
    process.exit(0);
  } catch (err) {
    console.error("[createAdmin] Error:", err.message);
    process.exit(1);
  }
})();
