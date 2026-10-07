const express = require("express");
const router = express.Router();
const { isAuthenticated, isAdmin } = require("../middleware/auth");
const {
  createJob,
  singleJob,
  updateJob,
  deleteJobs,
} = require("../controllers/jobsController");
const {
  updateStatus,
  updateRecruiterApplicationStatus,
} = require("../controllers/applicationStatusController");
const {
  recruiterAnalytics,
} = require("../controllers/recruiterAnalyticsController");
const {
  scheduleRecruiterInterview,
  rescheduleRecruiterInterview,
  completeRecruiterInterview,
} = require("../controllers/recruiterInterviewController");
const {
  showAdminUserApplyJob,
  adminShowUserApplyJob,
  getRecruiterApplications,
  getRecruiterApplicationById,
  getRecruiterApplicationResume,
  getSuitableCandidatesForJob,
} = require("../controllers/recruiterApplicationsController");
const {
  showJobs,
  showAllJobs,
  showJobsyByUser,
} = require("../controllers/jobSearchController");

//job router

// /api/job/create
router.post("/job/create", isAuthenticated, isAdmin, createJob);

// /api/job/id
router.get("/job/:id", singleJob);

// /api/job/update/job_id
router.patch("/job/update/:job_id", isAuthenticated, isAdmin, updateJob);

// /api/jobs/show
router.get("/jobs/show/", showJobs);
// /api/jobs/showalljobs
router.get("/jobs/showalljobs", showAllJobs);

// /api/jobs/show
router.get("/jobs/showByUser/:id", showJobsyByUser);
router.get(
  "/recruiter/analytics",
  isAuthenticated,
  isAdmin,
  recruiterAnalytics,
);
router.get(
  "/recruiter/applications",
  isAuthenticated,
  isAdmin,
  getRecruiterApplications,
);
router.get(
  "/recruiter/applications/:applicationId",
  isAuthenticated,
  isAdmin,
  getRecruiterApplicationById,
);
router.get(
  "/recruiter/jobs/:jobId/candidates",
  isAuthenticated,
  isAdmin,
  getSuitableCandidatesForJob,
);
router.patch(
  "/recruiter/applications/:applicationId/status",
  isAuthenticated,
  isAdmin,
  updateRecruiterApplicationStatus,
);
router.post(
  "/recruiter/applications/:applicationId/interview",
  isAuthenticated,
  isAdmin,
  scheduleRecruiterInterview,
);
router.patch(
  "/recruiter/applications/:applicationId/interview",
  isAuthenticated,
  isAdmin,
  rescheduleRecruiterInterview,
);
router.patch(
  "/recruiter/applications/:applicationId/interview/complete",
  isAuthenticated,
  isAdmin,
  completeRecruiterInterview,
);
router.get(
  "/recruiter/applications/:applicationId/resume",
  isAuthenticated,
  isAdmin,
  getRecruiterApplicationResume,
);
// /api/jobs/userapply/:id
router.get("/jobs/userapply/:id", showAdminUserApplyJob);
router.get(
  "/admin/applied-jobs/:id?",
  isAuthenticated,
  isAdmin,
  adminShowUserApplyJob,
);
// /api/jobs/delete
router.delete("/jobs/delete/:id", isAuthenticated, isAdmin, deleteJobs);
// /api/updatestatus/:id
router.patch("/updatestatus", isAuthenticated, updateStatus);
module.exports = router;
