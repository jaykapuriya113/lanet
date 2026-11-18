const express = require("express");
const {
  allUser,
  singleUser,
  editUser,
  deleteUser,
  createUserJobsHistory,
  ShowAllUser,
  getUserApplications,
  submitApplicationFeedback,
  respondToInterview,
  getUserNotifications,
  getUnreadNotificationCount,
  markUserNotificationAsRead,
  markAllUserNotificationsAsRead,
} = require("../controllers/userController");
const {
  getSavedJobs,
  saveJob,
  removeSavedJob,
} = require("../controllers/savedJobController");
const {
  getRecruiterPlatformFeedback,
  submitRecruiterPlatformFeedback,
} = require("../controllers/platformFeedbackController");
const {
  getUserPlatformFeedback,
  submitUserPlatformFeedback,
} = require("../controllers/userPlatformFeedbackController");
const {
  getResumeRecommendations,
  getPreparationPlan,
} = require("../controllers/resumeAnalyzerController");
const { submitReport } = require("../controllers/reportController");
const { provisionChatUser } = require("../controllers/chatController");
const { isAuthenticated, isAdmin, isMainAdmin } = require("../middleware/auth");
const router = express.Router();

//user router

//  /api/allusers
router.get("/allusers", isAuthenticated, isMainAdmin, allUser);
//  /api/showallusers
router.get("/showallusers", isAuthenticated, isMainAdmin, ShowAllUser);
// specific user routes must be registered before /user/:id to avoid shadowing
// AI Resume Analyzer - user only
router.get(
  "/user/resume-recommendations",
  isAuthenticated,
  getResumeRecommendations
);
router.post("/user/prepare", isAuthenticated, getPreparationPlan);
router.get("/user/applications", isAuthenticated, getUserApplications);
router.get(
  "/user/platform-feedback",
  isAuthenticated,
  getUserPlatformFeedback,
);
router.post(
  "/user/platform-feedback",
  isAuthenticated,
  submitUserPlatformFeedback,
);
router.post(
  "/user/applications/:applicationId/feedback",
  isAuthenticated,
  submitApplicationFeedback,
);
router.patch(
  "/user/applications/:applicationId/interview-response",
  isAuthenticated,
  respondToInterview,
);
router.get("/user/notifications", isAuthenticated, getUserNotifications);
router.get(
  "/user/notifications/unread-count",
  isAuthenticated,
  getUnreadNotificationCount,
);
router.patch(
  "/user/notifications/read-all",
  isAuthenticated,
  markAllUserNotificationsAsRead,
);
router.patch(
  "/user/notifications/:notificationId/read",
  isAuthenticated,
  markUserNotificationAsRead,
);
router.get(
  "/recruiter/platform-feedback",
  isAuthenticated,
  getRecruiterPlatformFeedback,
);
router.post(
  "/recruiter/platform-feedback",
  isAuthenticated,
  submitRecruiterPlatformFeedback,
);
router.get("/user/saved-jobs", isAuthenticated, getSavedJobs);
router.post("/user/saved-jobs/:jobId", isAuthenticated, saveJob);
router.delete("/user/saved-jobs/:jobId", isAuthenticated, removeSavedJob);
// Report suspicious / inappropriate job
router.post("/user/report", isAuthenticated, submitReport);
// CometChat server-side provisioning — returns uid + authToken, never exposes REST key
router.post("/chat/provision", isAuthenticated, provisionChatUser);
router.post("/user/jobhistory/", isAuthenticated, createUserJobsHistory);

//  /api/user/id
router.get("/user/:id", isAuthenticated, singleUser);

//  /api/user/edit/id
router.patch("/user/edit/:id", isAuthenticated, editUser);

//  /api/admin/user/delete/id
router.delete(
  "/admin/user/delete/:id",
  isAuthenticated,
  isMainAdmin,
  deleteUser,
);

module.exports = router;
