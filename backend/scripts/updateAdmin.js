/**
 * CLI script: update an existing role=2 admin's email and/or password.
 *
 * Usage
 * -----
 *   node scripts/updateAdmin.js
 *
 * Required env vars (set in backend/.env before running):
 *   ADMIN_OLD_EMAIL  – current email of the admin account to update
 *   ADMIN_EMAIL      – new email  (can be same as ADMIN_OLD_EMAIL to skip email change)
 *   ADMIN_PASSWORD   – new password (min 6 chars)
 *
 * What it does
 * ------------
 *  1. Finds the role=2 account whose email matches ADMIN_OLD_EMAIL.
 *  2. Checks that ADMIN_EMAIL is not already used by a different account.
 *  3. Updates email (if changed) and password.
 *  4. Password is re-hashed through the existing bcryptjs pre-save hook on
 *     userSchema — no manual bcrypt call is needed here.
 *  5. Verifies the new hash with comparePassword before reporting success.
 *  6. Never prints passwords, tokens, or other secret values.
 *
 * Safety
 * ------
 *  - Does NOT create new accounts.
 *  - Does NOT touch any role=0 (user) or role=1 (recruiter) accounts.
 *  - Does NOT modify authControllers, userModel, or any other file.
 *  - Exits with code 1 on any error so CI/shell callers can detect failure.
 */

"use strict";

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const User     = require("../models/userModel");

// ── 1. Validate env vars ────────────────────────────────────────────────────
const {
  ADMIN_OLD_EMAIL,
  ADMIN_EMAIL:    NEW_EMAIL,
  ADMIN_PASSWORD: NEW_PASSWORD,
  DATABASE,
} = process.env;

const missing = [];
if (!ADMIN_OLD_EMAIL) missing.push("ADMIN_OLD_EMAIL");
if (!NEW_EMAIL)       missing.push("ADMIN_EMAIL");
if (!NEW_PASSWORD)    missing.push("ADMIN_PASSWORD");

if (missing.length) {
  console.error(`[updateAdmin] Missing required env vars: ${missing.join(", ")}`);
  console.error("Add them to backend/.env and retry.");
  process.exit(1);
}

if (NEW_PASSWORD.length < 6) {
  console.error("[updateAdmin] ADMIN_PASSWORD must be at least 6 characters.");
  process.exit(1);
}

if (!DATABASE) {
  console.error("[updateAdmin] DATABASE env var is not set.");
  process.exit(1);
}

// ── 2. Main ─────────────────────────────────────────────────────────────────
(async () => {
  try {
    await mongoose.connect(DATABASE, {
      useNewUrlParser:    true,
      useUnifiedTopology: true,
    });
    console.log("[updateAdmin] Connected to database:", mongoose.connection.name);

    // ── 2a. Find the target admin account ───────────────────────────────────
    const admin = await User.findOne({
      email: ADMIN_OLD_EMAIL.trim().toLowerCase(),
      role:  2,
    });

    if (!admin) {
      console.error(
        `[updateAdmin] No role=2 account found with email "${ADMIN_OLD_EMAIL}".`,
      );
      console.error("Run 'node scripts/createAdmin.js' to create one first.");
      process.exit(1);
    }

    console.log(`[updateAdmin] Found admin: ${admin.firstName} ${admin.lastName} <${admin.email}>`);

    // ── 2b. Check new email is not taken by a different account ─────────────
    const normalizedNew = NEW_EMAIL.trim().toLowerCase();
    if (normalizedNew !== admin.email) {
      const conflict = await User.findOne({ email: normalizedNew });
      if (conflict) {
        console.error(
          `[updateAdmin] Email "${normalizedNew}" is already used by another account (role=${conflict.role}). Aborting.`,
        );
        process.exit(1);
      }
    }

    // ── 2c. Apply changes ───────────────────────────────────────────────────
    const emailChanged    = normalizedNew !== admin.email;
    admin.email           = normalizedNew;
    admin.password        = NEW_PASSWORD; // pre-save hook will bcrypt-hash this

    // save() triggers the bcrypt pre-save hook on userSchema automatically
    await admin.save();

    // ── 2d. Verify the new hash works before reporting success ───────────────
    const updated = await User.findById(admin._id); // fresh doc with new hash
    const valid   = await updated.comparePassword(NEW_PASSWORD);
    if (!valid) {
      console.error("[updateAdmin] Hash verification failed after save. Something went wrong.");
      process.exit(1);
    }

    // ── 2e. Report — never print the password ───────────────────────────────
    console.log("");
    console.log("✅ Admin credentials updated successfully.");
    console.log(`   Name     : ${updated.firstName} ${updated.lastName}`);
    console.log(`   Email    : ${updated.email}` + (emailChanged ? `  (was: ${ADMIN_OLD_EMAIL})` : "  (unchanged)"));
    console.log("   Password : [updated — hash verified ✓]");
    console.log(`   Role     : ${updated.role}`);
    console.log(`   ID       : ${updated._id}`);
    console.log("");
    console.log("You can now remove ADMIN_OLD_EMAIL (and optionally ADMIN_PASSWORD)");
    console.log("from backend/.env to keep it clean.");

    process.exit(0);
  } catch (err) {
    console.error("[updateAdmin] Error:", err.message);
    process.exit(1);
  }
})();
