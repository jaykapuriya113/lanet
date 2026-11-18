const express = require("express");
const {
  signup,
  signin,
  userProfile,
  forgotPassword,
  resetPassword,
  updatePassword,
  verifyEmail,
  resendVerificationCode,
} = require("../controllers/authControllers");
const { isAuthenticated } = require("../middleware/auth");
const {
  startGoogleOAuth,
  googleOAuthCallback,
} = require("../controllers/googleOAuthController");
const router = express.Router();

//auth router
router.get("/google/oauth", startGoogleOAuth);
router.get("/google/oauth/callback", googleOAuthCallback);

//  /api/signup
router.post("/signup", signup);

//  /api/verify-email  { email, code }
router.post("/verify-email", verifyEmail);

//  /api/resend-verification  { email }
router.post("/resend-verification", resendVerificationCode);

//  /api/signin
router.post("/signin", signin);

//  /api/logout
router.get("/logout", userProfile);

//  /api/me
router.get("/me", isAuthenticated, userProfile);
//  /api/forgetpassword
router.post("/forgetpassword", forgotPassword);
router.patch("/resetPassword/:token", resetPassword);
module.exports = router;
