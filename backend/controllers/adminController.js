const User = require("../models/userModel");
const Job = require("../models/jobModel");
const UserHistory = require("../models/jobHistory");
const ErrorResponse = require("../utils/errorResponse");
const mongoose = require("mongoose");

/**
 * GET /api/admin/jobs
 * Returns every non-deleted job, with recruiter first+last name populated.
 * Protected by isAuthenticated + isMainAdmin (role=2).
 */
exports.getAdminJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .populate("user", "firstName lastName")
      .lean();

    res.status(200).json({ success: true, jobs });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/stats
 * Returns platform-wide counts for the admin dashboard.
 */
exports.getStats = async (req, res, next) => {
  try {
    const [totalUsers, totalRecruiters, totalJobs, totalApplications, activeJobs] =
      await Promise.all([
        User.countDocuments({ role: 0, isDeleted: false }),
        User.countDocuments({ role: 1, isDeleted: false }),
        Job.countDocuments({ isDeleted: false }),
        UserHistory.countDocuments({}),
        Job.countDocuments({ isDeleted: false, available: true }),
      ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalRecruiters,
        totalJobs,
        activeJobs,
        totalApplications,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/recruiters
 * Returns all non-deleted recruiter accounts (role=1) with enriched company info.
 *
 * For each recruiter:
 *  - companyName is taken from the user record when present; otherwise falls back
 *    to the most recent job the recruiter posted (companyName on jobModel).
 *  - phoneNumber is returned as stored on the user record.
 *  - jobCount is the number of non-deleted jobs posted by the recruiter.
 */
exports.getRecruiters = async (req, res, next) => {
  try {
    const recruiters = await User.find({ role: 1, isDeleted: false })
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    const recruiterIds = recruiters.map((r) => r._id);

    // Aggregate job counts per recruiter
    const jobCounts = await Job.aggregate([
      { $match: { user: { $in: recruiterIds }, isDeleted: false } },
      { $group: { _id: "$user", count: { $sum: 1 } } },
    ]);
    const countMap = {};
    jobCounts.forEach((entry) => {
      countMap[String(entry._id)] = entry.count;
    });

    // For recruiters whose user record has no companyName, pull it from their
    // most-recently-posted job so the admin sees something useful.
    const needsCompany = recruiters
      .filter((r) => !r.companyName)
      .map((r) => r._id);

    let jobCompanyMap = {};
    if (needsCompany.length > 0) {
      // Get the most recent job per recruiter (sort descending, group takes first)
      const jobCompanyDocs = await Job.aggregate([
        { $match: { user: { $in: needsCompany }, isDeleted: false } },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: "$user",
            companyName: { $first: "$companyName" },
          },
        },
      ]);
      jobCompanyDocs.forEach((doc) => {
        jobCompanyMap[String(doc._id)] = doc.companyName || "";
      });
    }

    const enriched = recruiters.map((r) => ({
      ...r,
      jobCount: countMap[String(r._id)] || 0,
      // Use the user-level companyName when available; otherwise fall back to
      // companyName extracted from their most recent job posting.
      companyName: r.companyName || jobCompanyMap[String(r._id)] || "",
    }));

    res.status(200).json({ success: true, recruiters: enriched });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/recruiter/:id
 * Soft-deletes a recruiter account (role=1 only; cannot delete users or other admins).
 */
exports.deleteRecruiter = async (req, res, next) => {
  try {
    const recruiter = await User.findById(req.params.id);
    if (!recruiter) return next(new ErrorResponse("Recruiter not found", 404));
    if (Number(recruiter.role) !== 1) {
      return next(new ErrorResponse("Target account is not a recruiter", 400));
    }
    await User.findByIdAndUpdate(req.params.id, { isDeleted: true });
    res.status(200).json({ success: true, message: "Recruiter deleted" });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/job/:id/toggle
 * Toggles the `available` flag on a job.
 */
exports.toggleJobAvailable = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return next(new ErrorResponse("Job not found", 404));
    if (job.isDeleted) return next(new ErrorResponse("Job has been deleted", 400));

    job.available = !job.available;
    await job.save();

    res.status(200).json({
      success: true,
      available: job.available,
      message: `Job marked as ${job.available ? "available" : "unavailable"}`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/applications
 * Read-only: returns all job applications with applicant name/email,
 * job title, recruiter/company name, applied date, and current status.
 * Supports optional ?status= and ?search= query filters.
 * Protected by isAuthenticated + isMainAdmin (role=2).
 */
exports.getAdminApplications = async (req, res, next) => {
  try {
    const { status, search } = req.query;

    // Build base match — no restrictions, admin sees everything
    const match = {};
    if (
      status &&
      [
        "pending",
        "under_review",
        "shortlisted",
        "interview",
        "selected",
        "accepted",
        "rejected",
      ].includes(status)
    ) {
      match.applicationStatus = status;
    }

    // Fetch all applications, populate applicant and job
    let applications = await UserHistory.find(match)
      .sort({ createdAt: -1 })
      .populate("user", "firstName lastName email")
      .populate("jobId", "title companyName user")
      .lean();

    // Collect all unique recruiter IDs from the job docs so we can do a
    // single User lookup for recruiter names / company names
    const recruiterIds = [
      ...new Set(
        applications
          .map((a) => a.jobId?.user)
          .filter(Boolean)
          .map(String),
      ),
    ].map((id) => new mongoose.Types.ObjectId(id));

    const recruiters = await User.find(
      { _id: { $in: recruiterIds } },
      "firstName lastName companyName",
    ).lean();
    const recruiterMap = {};
    recruiters.forEach((r) => {
      recruiterMap[String(r._id)] = r;
    });

    // Shape each application for the admin view
    let result = applications.map((a) => {
      const recruiter = a.jobId?.user ? recruiterMap[String(a.jobId.user)] : null;
      return {
        _id: a._id,
        applicantName:
          a.user
            ? `${a.user.firstName || ""} ${a.user.lastName || ""}`.trim()
            : "Unknown",
        applicantEmail: a.user?.email || "—",
        jobTitle: a.jobId?.title || a.title || "—",
        companyName:
          a.jobId?.companyName ||
          recruiter?.companyName ||
          (recruiter ? `${recruiter.firstName} ${recruiter.lastName}`.trim() : "—"),
        recruiterName: recruiter
          ? `${recruiter.firstName} ${recruiter.lastName}`.trim()
          : "—",
        applicationStatus: a.applicationStatus || "pending",
        appliedAt: a.createdAt,
      };
    });

    // Client-side-style search: filter by applicant name, email, or job title
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (a) =>
          a.applicantName.toLowerCase().includes(q) ||
          a.applicantEmail.toLowerCase().includes(q) ||
          a.jobTitle.toLowerCase().includes(q) ||
          a.companyName.toLowerCase().includes(q),
      );
    }

    res.status(200).json({ success: true, applications: result, total: result.length });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/job/:id
 * Soft-deletes any job regardless of owner.
 */
exports.adminDeleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return next(new ErrorResponse("Job not found", 404));

    await Job.findByIdAndUpdate(req.params.id, { isDeleted: true });
    res.status(200).json({ success: true, message: "Job deleted" });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// USERS MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/users
 * All users (role=0), excluding permanently deleted accounts.
 */
exports.getAdminUsers = async (req, res, next) => {
  try {
    const users = await User.find({ role: 0, isDeleted: false })
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/user/:id/deactivate
 * Sets isActive=false. The user can no longer log in but their data is preserved.
 * Cannot deactivate the currently logged-in admin.
 */
exports.deactivateUser = async (req, res, next) => {
  try {
    if (String(req.user._id) === String(req.params.id)) {
      return next(new ErrorResponse("Cannot deactivate your own account", 400));
    }
    const user = await User.findOne({ _id: req.params.id, isDeleted: false });
    if (!user) return next(new ErrorResponse("User not found", 404));
    if (user.isActive === false) {
      return next(new ErrorResponse("User is already deactivated", 400));
    }
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    res.status(200).json({ success: true, message: "User deactivated" });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/user/:id/reactivate
 * Sets isActive=true, restoring login access.
 */
exports.reactivateUser = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id, isDeleted: false });
    if (!user) return next(new ErrorResponse("User not found", 404));
    if (user.isActive !== false) {
      return next(new ErrorResponse("User is already active", 400));
    }
    await User.findByIdAndUpdate(req.params.id, { isActive: true });
    res.status(200).json({ success: true, message: "User reactivated" });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/user/:id
 * Safe permanent soft-delete for a user (role=0).
 * Applications and history are preserved. Cannot delete self.
 * Cannot delete the last active main admin (role=2).
 */
exports.safeDeleteUser = async (req, res, next) => {
  try {
    if (String(req.user._id) === String(req.params.id)) {
      return next(new ErrorResponse("Cannot delete your own account", 400));
    }
    const user = await User.findOne({ _id: req.params.id, isDeleted: false });
    if (!user) return next(new ErrorResponse("User not found", 404));
    if (Number(user.role) === 2) {
      // Protect the last main admin
      const activeMainAdmins = await User.countDocuments({
        role: 2,
        isDeleted: false,
        isActive: { $ne: false },
      });
      if (activeMainAdmins <= 1) {
        return next(new ErrorResponse("Cannot delete the last active main admin", 400));
      }
    }
    await User.findByIdAndUpdate(req.params.id, { isDeleted: true, isActive: false });
    res.status(200).json({ success: true, message: "User deleted" });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// RECRUITERS MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PATCH /api/admin/recruiter/:id/deactivate
 * Deactivates a recruiter and unpublishes (available=false) all their active jobs.
 * Application history is preserved.
 */
exports.deactivateRecruiter = async (req, res, next) => {
  try {
    if (String(req.user._id) === String(req.params.id)) {
      return next(new ErrorResponse("Cannot deactivate your own account", 400));
    }
    const recruiter = await User.findOne({
      _id: req.params.id,
      role: 1,
      isDeleted: false,
    });
    if (!recruiter) return next(new ErrorResponse("Recruiter not found", 404));
    if (recruiter.isActive === false) {
      return next(new ErrorResponse("Recruiter is already deactivated", 400));
    }
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    // Unpublish all active jobs belonging to this recruiter
    await Job.updateMany(
      { user: req.params.id, isDeleted: false },
      { available: false },
    );
    res.status(200).json({
      success: true,
      message: "Recruiter deactivated and jobs unpublished",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/recruiter/:id/reactivate
 * Reactivates a recruiter. Jobs remain unpublished — recruiter republishes manually.
 */
exports.reactivateRecruiter = async (req, res, next) => {
  try {
    const recruiter = await User.findOne({
      _id: req.params.id,
      role: 1,
      isDeleted: false,
    });
    if (!recruiter) return next(new ErrorResponse("Recruiter not found", 404));
    if (recruiter.isActive !== false) {
      return next(new ErrorResponse("Recruiter is already active", 400));
    }
    await User.findByIdAndUpdate(req.params.id, { isActive: true });
    res.status(200).json({ success: true, message: "Recruiter reactivated" });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/recruiter/:id/verify
 * Sets verificationStatus to "verified" or "rejected".
 * Body: { status: "verified" | "rejected" }
 * Rejecting also deactivates the recruiter and unpublishes their jobs.
 */
exports.verifyRecruiter = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["verified", "rejected"].includes(status)) {
      return next(new ErrorResponse('status must be "verified" or "rejected"', 400));
    }
    const recruiter = await User.findOne({
      _id: req.params.id,
      role: 1,
      isDeleted: false,
    });
    if (!recruiter) return next(new ErrorResponse("Recruiter not found", 404));

    const update = { verificationStatus: status };
    if (status === "rejected") {
      // Rejection deactivates the account
      update.isActive = false;
      await Job.updateMany(
        { user: req.params.id, isDeleted: false },
        { available: false },
      );
    }
    await User.findByIdAndUpdate(req.params.id, update);
    res.status(200).json({
      success: true,
      message: `Recruiter ${status}`,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// JOBS MANAGEMENT — RESTORE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/jobs/deleted
 * Returns all soft-deleted jobs for the admin Deleted Jobs view.
 */
exports.getDeletedJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find({ isDeleted: true })
      .sort({ updatedAt: -1 })
      .populate("user", "firstName lastName")
      .lean();
    res.status(200).json({ success: true, jobs });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/job/:id/restore
 * Restores a soft-deleted job (sets isDeleted=false).
 * The job's recruiter must be active and not deleted for restore to succeed.
 */
exports.restoreJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).populate("user", "isDeleted isActive");
    if (!job) return next(new ErrorResponse("Job not found", 404));
    if (!job.isDeleted) return next(new ErrorResponse("Job is not deleted", 400));

    // Guard: recruiter must be active
    const recruiter = job.user;
    if (!recruiter || recruiter.isDeleted) {
      return next(new ErrorResponse("Cannot restore: recruiter account no longer exists", 400));
    }
    if (recruiter.isActive === false) {
      return next(new ErrorResponse("Cannot restore: recruiter account is deactivated", 400));
    }

    await Job.findByIdAndUpdate(req.params.id, { isDeleted: false });
    res.status(200).json({ success: true, message: "Job restored" });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORIES MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────
const JobType = require("../models/jobTypeModel");

/**
 * GET /api/admin/category/:id/job-count
 * Returns the number of non-deleted jobs linked to the given category.
 */
exports.getCategoryJobCount = async (req, res, next) => {
  try {
    const count = await Job.countDocuments({
      jobType: req.params.id,
      isDeleted: false,
    });
    res.status(200).json({ success: true, count });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/category/:id
 * Safe category delete:
 *  - If no active jobs reference it → delete immediately.
 *  - If active jobs reference it and ?reassignTo=<otherId> is provided →
 *    reassign all linked jobs then delete.
 *  - Otherwise → 409 with count so the UI can show the reassign prompt.
 */
exports.safeDeleteCategory = async (req, res, next) => {
  try {
    const catId = req.params.id;
    const { reassignTo } = req.query;

    const category = await JobType.findById(catId);
    if (!category) return next(new ErrorResponse("Category not found", 404));

    const linkedCount = await Job.countDocuments({
      jobType: catId,
      isDeleted: false,
    });

    if (linkedCount === 0) {
      await JobType.findByIdAndDelete(catId);
      return res.status(200).json({ success: true, message: "Category deleted" });
    }

    // Jobs are linked — need reassignment target
    if (!reassignTo) {
      return res.status(409).json({
        success: false,
        linkedCount,
        message: `${linkedCount} job${linkedCount !== 1 ? "s are" : " is"} linked to this category. Provide reassignTo query param.`,
      });
    }

    const targetCategory = await JobType.findById(reassignTo);
    if (!targetCategory) {
      return next(new ErrorResponse("Reassignment target category not found", 404));
    }
    if (String(reassignTo) === String(catId)) {
      return next(new ErrorResponse("Cannot reassign to the same category", 400));
    }

    // Reassign all linked jobs, then delete
    await Job.updateMany({ jobType: catId, isDeleted: false }, { jobType: reassignTo });
    await JobType.findByIdAndDelete(catId);
    return res.status(200).json({
      success: true,
      message: `${linkedCount} job${linkedCount !== 1 ? "s" : ""} reassigned and category deleted`,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SPAM INDICATORS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/spam-indicators
 * Returns real heuristic signals based on stored data:
 *  - Jobs with 3+ pending reports
 *  - Jobs with suspiciously short descriptions (< 80 chars)
 *  - Recruiters who posted 5+ jobs in 24 h
 *  - Duplicate job titles from the same recruiter within 7 days
 */
exports.getSpamIndicators = async (req, res, next) => {
  try {
    const Report = require("../models/reportModel");

    // 1. Jobs with multiple pending reports
    const reportCounts = await Report.aggregate([
      { $match: { status: "pending" } },
      { $group: { _id: "$job", count: { $sum: 1 } } },
      { $match: { count: { $gte: 3 } } },
      { $sort: { count: -1 } },
    ]);
    const flaggedJobIds = reportCounts.map((r) => r._id);
    const flaggedJobs = await Job.find({
      _id: { $in: flaggedJobIds },
      isDeleted: false,
    })
      .populate("user", "firstName lastName")
      .lean();
    const multiReportFlagged = flaggedJobs.map((j) => {
      const rc = reportCounts.find((r) => String(r._id) === String(j._id));
      return {
        type: "multiple_reports",
        severity: "high",
        jobId: j._id,
        jobTitle: j.title,
        companyName: j.companyName,
        recruiterName: j.user ? `${j.user.firstName} ${j.user.lastName}` : "—",
        detail: `${rc?.count || 0} pending reports`,
      };
    });

    // 2. Very short descriptions (likely spam/placeholder)
    const shortDescJobs = await Job.find({
      isDeleted: false,
      $expr: { $lt: [{ $strLenCP: { $ifNull: ["$description", ""] } }, 80] },
    })
      .select("title companyName description user")
      .populate("user", "firstName lastName")
      .lean();
    const shortDescFlagged = shortDescJobs.map((j) => ({
      type: "short_description",
      severity: "low",
      jobId: j._id,
      jobTitle: j.title,
      companyName: j.companyName,
      recruiterName: j.user ? `${j.user.firstName} ${j.user.lastName}` : "—",
      detail: `Description is only ${(j.description || "").length} characters`,
    }));

    // 3. Recruiters posting 5+ jobs in 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const burstPosters = await Job.aggregate([
      { $match: { isDeleted: false, createdAt: { $gte: oneDayAgo } } },
      { $group: { _id: "$user", count: { $sum: 1 } } },
      { $match: { count: { $gte: 5 } } },
    ]);
    const burstRecruiterIds = burstPosters.map((b) => b._id);
    const burstRecruiters = await User.find(
      { _id: { $in: burstRecruiterIds } },
      "firstName lastName",
    ).lean();
    const burstMap = {};
    burstRecruiters.forEach((r) => { burstMap[String(r._id)] = r; });
    const burstFlagged = burstPosters.map((b) => {
      const rec = burstMap[String(b._id)];
      return {
        type: "burst_posting",
        severity: "medium",
        recruiterId: b._id,
        recruiterName: rec ? `${rec.firstName} ${rec.lastName}` : "—",
        detail: `${b.count} jobs posted in the last 24 hours`,
      };
    });

    // 4. Duplicate job titles from same recruiter within 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dupeTitles = await Job.aggregate([
      { $match: { isDeleted: false, createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: { user: "$user", title: "$title" }, count: { $sum: 1 }, ids: { $push: "$_id" } } },
      { $match: { count: { $gte: 2 } } },
    ]);
    const dupeFlagged = await Promise.all(
      dupeTitles.map(async (d) => {
        const rec = await User.findById(d._id.user, "firstName lastName").lean();
        return {
          type: "duplicate_title",
          severity: "medium",
          recruiterId: d._id.user,
          recruiterName: rec ? `${rec.firstName} ${rec.lastName}` : "—",
          jobTitle: d._id.title,
          detail: `"${d._id.title}" posted ${d.count} times in 7 days`,
          jobIds: d.ids,
        };
      }),
    );

    const indicators = [
      ...multiReportFlagged,
      ...burstFlagged,
      ...dupeFlagged,
      ...shortDescFlagged,
    ];

    res.status(200).json({ success: true, indicators, total: indicators.length });
  } catch (error) {
    next(error);
  }
};
