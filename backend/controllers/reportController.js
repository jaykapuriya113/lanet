const Report = require("../models/reportModel");
const Job = require("../models/jobModel");
const ErrorResponse = require("../utils/errorResponse");

// ─────────────────────────────────────────────────────────────────────────────
// USER  –  POST /api/user/report
// Authenticated users can report a suspicious/inappropriate job.
// One report per user per job (enforced by unique index).
// ─────────────────────────────────────────────────────────────────────────────
exports.submitReport = async (req, res, next) => {
  try {
    const { jobId, reason, details } = req.body;

    if (!jobId || !reason) {
      return next(new ErrorResponse("jobId and reason are required", 400));
    }

    const job = await Job.findById(jobId);
    if (!job || job.isDeleted) {
      return next(new ErrorResponse("Job not found", 404));
    }

    const report = await Report.create({
      contentType: "job",
      job: jobId,
      jobTitle: job.title,
      reason,
      details: details || "",
      reporter: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Report submitted. Our team will review it shortly.",
      reportId: report._id,
    });
  } catch (error) {
    // Duplicate key → user already reported this job
    if (error.code === 11000) {
      return next(
        new ErrorResponse("You have already reported this job.", 409),
      );
    }
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN  –  GET /api/admin/reports
// Returns all reports, most recent first.
// Optional ?status= and ?search= filters.
// ─────────────────────────────────────────────────────────────────────────────
exports.getAdminReports = async (req, res, next) => {
  try {
    const { status, search } = req.query;

    const match = {};
    if (
      status &&
      ["pending", "reviewed", "dismissed", "resolved"].includes(status)
    ) {
      match.status = status;
    }

    let reports = await Report.find(match)
      .sort({ createdAt: -1 })
      .populate("reporter", "firstName lastName email")
      .populate("job", "title companyName isDeleted")
      .lean();

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      reports = reports.filter(
        (r) =>
          (r.jobTitle || "").toLowerCase().includes(q) ||
          (r.job?.title || "").toLowerCase().includes(q) ||
          (r.job?.companyName || "").toLowerCase().includes(q) ||
          (r.reporter?.email || "").toLowerCase().includes(q) ||
          `${r.reporter?.firstName || ""} ${r.reporter?.lastName || ""}`
            .toLowerCase()
            .includes(q),
      );
    }

    res.status(200).json({ success: true, reports, total: reports.length });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN  –  PATCH /api/admin/reports/:id/status
// Update a report's status to: reviewed | dismissed | resolved
// Optionally stores an admin note.
// ─────────────────────────────────────────────────────────────────────────────
exports.updateReportStatus = async (req, res, next) => {
  try {
    const { status, adminNote } = req.body;
    const allowed = ["reviewed", "dismissed", "resolved"];

    if (!allowed.includes(status)) {
      return next(
        new ErrorResponse(
          `status must be one of: ${allowed.join(", ")}`,
          400,
        ),
      );
    }

    const report = await Report.findById(req.params.id);
    if (!report) return next(new ErrorResponse("Report not found", 404));

    report.status = status;
    report.reviewedAt = new Date();
    if (adminNote !== undefined) report.adminNote = adminNote;

    await report.save();

    res.status(200).json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN  –  DELETE /api/admin/reports/:id/job
// Soft-deletes the job linked to this report using the SAME safe-delete
// mechanism as adminDeleteJob in adminController.
// Does NOT delete the report itself so the audit trail is preserved.
// ─────────────────────────────────────────────────────────────────────────────
exports.removeReportedJob = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return next(new ErrorResponse("Report not found", 404));

    const job = await Job.findById(report.job);
    if (!job) return next(new ErrorResponse("Reported job not found", 404));
    if (job.isDeleted) {
      return next(new ErrorResponse("Job is already deleted", 400));
    }

    await Job.findByIdAndUpdate(report.job, { isDeleted: true });

    // Mark the report resolved automatically since the content is removed
    await Report.findByIdAndUpdate(req.params.id, {
      status: "resolved",
      reviewedAt: new Date(),
      adminNote: report.adminNote || "Job removed by admin.",
    });

    res.status(200).json({
      success: true,
      message: "Job soft-deleted and report marked resolved.",
    });
  } catch (error) {
    next(error);
  }
};
