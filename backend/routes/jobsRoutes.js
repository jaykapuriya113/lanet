const express = require("express");
const router = express.Router();
const { isAuthenticated, isAdmin } = require("../middleware/auth");
const {
  createJob,
  singleJob,
  updateJob,
  showJobs,
  deleteJobs,
  updateStatus,
  showJobsyByUser,
  showAdminUserApplyJob,
  adminShowUserApplyJob,
  showAllJobs,
} = require("../controllers/jobsController");

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
// /api/jobs/userapply/:id
router.get("/jobs/userapply/:id", showAdminUserApplyJob);
router.get("/admin/applied-jobs/:id?", adminShowUserApplyJob);

// /api/jobs/delete
router.delete("/jobs/delete/:id", isAuthenticated, isAdmin, deleteJobs);
// /api/updatestatus/:id
router.patch("/updatestatus", isAuthenticated, updateStatus);
module.exports = router;
