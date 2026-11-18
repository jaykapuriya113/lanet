const express = require("express");
const {
  getAdminJobs,
  getStats,
  getRecruiters,
  deleteRecruiter,
  toggleJobAvailable,
  adminDeleteJob,
  getAdminApplications,
  // Users
  getAdminUsers,
  deactivateUser,
  reactivateUser,
  safeDeleteUser,
  // Recruiters
  deactivateRecruiter,
  reactivateRecruiter,
  verifyRecruiter,
  // Jobs
  getDeletedJobs,
  restoreJob,
  // Categories
  getCategoryJobCount,
  safeDeleteCategory,
  // Spam
  getSpamIndicators,
} = require("../controllers/adminController");
const {
  getAdminReports,
  updateReportStatus,
  removeReportedJob,
} = require("../controllers/reportController");
const {
  getAdminFeedback,
  updateFeedbackStatus,
  deleteFeedback,
} = require("../controllers/adminFeedbackController");
const { isAuthenticated, isMainAdmin } = require("../middleware/auth");

const router = express.Router();

// All routes below require a valid JWT cookie AND role === 2
router.use(isAuthenticated, isMainAdmin);

// ── Stats ──────────────────────────────────────────────────────────────────
router.get("/admin/stats", getStats);

// ── Users ──────────────────────────────────────────────────────────────────
router.get("/admin/users", getAdminUsers);
router.patch("/admin/user/:id/deactivate", deactivateUser);
router.patch("/admin/user/:id/reactivate", reactivateUser);
router.delete("/admin/user/:id", safeDeleteUser);

// ── Recruiters ─────────────────────────────────────────────────────────────
router.get("/admin/recruiters", getRecruiters);
router.patch("/admin/recruiter/:id/deactivate", deactivateRecruiter);
router.patch("/admin/recruiter/:id/reactivate", reactivateRecruiter);
router.patch("/admin/recruiter/:id/verify", verifyRecruiter);
router.delete("/admin/recruiter/:id", deleteRecruiter);

// ── Jobs ───────────────────────────────────────────────────────────────────
router.get("/admin/jobs", getAdminJobs);
router.get("/admin/jobs/deleted", getDeletedJobs);
router.patch("/admin/job/:id/toggle", toggleJobAvailable);
router.patch("/admin/job/:id/restore", restoreJob);
router.delete("/admin/job/:id", adminDeleteJob);

// ── Applications ────────────────────────────────────────────────────────────
router.get("/admin/applications", getAdminApplications);

// ── Categories ─────────────────────────────────────────────────────────────
router.get("/admin/category/:id/job-count", getCategoryJobCount);
router.delete("/admin/category/:id", safeDeleteCategory);

// ── Spam indicators ────────────────────────────────────────────────────────
router.get("/admin/spam-indicators", getSpamIndicators);

// ── Reports ────────────────────────────────────────────────────────────────
router.get("/admin/reports", getAdminReports);
router.patch("/admin/reports/:id/status", updateReportStatus);
router.delete("/admin/reports/:id/job", removeReportedJob);

// ── Feedback ───────────────────────────────────────────────────────────────
router.get("/admin/feedback", getAdminFeedback);
router.patch("/admin/feedback/:id/status", updateFeedbackStatus);
router.delete("/admin/feedback/:id", deleteFeedback);

module.exports = router;
