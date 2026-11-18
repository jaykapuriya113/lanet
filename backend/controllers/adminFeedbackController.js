/**
 * Admin Feedback Controller
 *
 * Surfaces two types of feedback for the admin panel:
 *
 *  1. Recruiter platform feedback  — stored in PlatformFeedback collection.
 *     These have their own status field (pending / reviewed / resolved).
 *
 *  2. User application feedback    — embedded sub-docs inside UserHistory
 *     (the `feedback` sub-document on each application), with Admin review
 *     status stored on that embedded feedback.
 *
 * The admin can:
 *   - GET  /api/admin/feedback            – list all feedback (both types)
 *   - PATCH /api/admin/feedback/:id/status – update recruiter feedback status
 *   - DELETE /api/admin/feedback/:id      – delete a recruiter feedback entry
 *
 * All routes are protected by isAuthenticated + isMainAdmin.
 */

const PlatformFeedback = require("../models/platformFeedbackModel");
const UserHistory = require("../models/jobHistory");
const ErrorResponse = require("../utils/errorResponse");

const formatUserApplicationFeedback = (application) => {
  const feedback = application.feedback;
  return {
    _id: `uf_${String(application._id)}`,
    feedbackType: "user_application",
    senderName: application.user
      ? `${application.user.firstName || ""} ${application.user.lastName || ""}`.trim()
      : "Unknown",
    senderEmail: application.user?.email || "—",
    senderRole: "User",
    message: feedback.comment,
    rating: feedback.rating,
    date: feedback.submittedAt,
    status: feedback.adminStatus || "submitted",
    jobTitle: application.jobId?.title || application.title || "—",
    companyName: application.jobId?.companyName || "—",
    adminNote: feedback.adminNote || "",
    reviewedAt: feedback.reviewedAt || null,
    _rawId: String(application._id),
  };
};

// ── GET /api/admin/feedback ──────────────────────────────────────────────────
// Returns unified list of recruiter platform feedback + user application
// feedback, most recent first.  Optional ?role= and ?status= filters.
// ?search= matches name, email, or feedback text.
exports.getAdminFeedback = async (req, res, next) => {
  try {
    const { role, status, search } = req.query;

    // ── 1. Recruiter platform feedback ──────────────────────────────────────
    let recruiterFeedback = [];
    if (!role || role === "recruiter") {
      let pfMatch = {};
      if (status && ["pending", "reviewed", "resolved"].includes(status)) {
        pfMatch.status = status;
      }

      const pf = await PlatformFeedback.find(pfMatch)
        .sort({ submittedAt: -1 })
        .populate("recruiter", "firstName lastName email")
        .lean();

      recruiterFeedback = pf.map((f) => ({
        _id: String(f._id),
        feedbackType: "recruiter_platform",
        senderName: f.recruiter
          ? `${f.recruiter.firstName || ""} ${f.recruiter.lastName || ""}`.trim()
          : "Unknown",
        senderEmail: f.recruiter?.email || "—",
        senderRole: "Recruiter",
        message: f.feedback,
        rating: f.rating,
        date: f.submittedAt || f.createdAt,
        status: f.status || "pending",
        adminNote: f.adminNote || "",
        reviewedAt: f.reviewedAt || null,
        // Keep the raw recruiter id for delete / status-update ops
        _rawId: String(f._id),
      }));
    }

    // ── 2. User application feedback ────────────────────────────────────────
    let userFeedback = [];
    if (!role || role === "user") {
      // Only pull applications that actually have a feedback sub-doc.
      if (!status || ["submitted", "reviewed", "resolved"].includes(status)) {
        const applications = await UserHistory.find({
          feedback: { $exists: true, $ne: null },
        })
          .sort({ "feedback.submittedAt": -1 })
          .populate("user", "firstName lastName email")
          .populate("jobId", "title companyName")
          .lean();

        userFeedback = applications
          .map(formatUserApplicationFeedback)
          .filter((entry) => !status || entry.status === status);
      }
    }

    let combined = [...recruiterFeedback, ...userFeedback];

    // Sort combined by date descending
    combined.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Search filter
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      combined = combined.filter(
        (f) =>
          f.senderName.toLowerCase().includes(q) ||
          f.senderEmail.toLowerCase().includes(q) ||
          f.message.toLowerCase().includes(q) ||
          (f.jobTitle || "").toLowerCase().includes(q),
      );
    }

    res.status(200).json({ success: true, feedback: combined, total: combined.length });
  } catch (error) {
    next(error);
  }
};

// ── PATCH /api/admin/feedback/:id/status ────────────────────────────────────
// Update status of recruiter platform or embedded user application feedback.
exports.updateFeedbackStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    const allowed = ["reviewed", "resolved"];
    if (!allowed.includes(status)) {
      return next(
        new ErrorResponse(`status must be one of: ${allowed.join(", ")}`, 400),
      );
    }

    if (id.startsWith("uf_")) {
      const application = await UserHistory.findOneAndUpdate(
        {
          _id: id.slice(3),
          feedback: { $exists: true, $ne: null },
        },
        {
          $set: {
            "feedback.adminStatus": status,
            "feedback.reviewedAt": new Date(),
            ...(adminNote !== undefined
              ? { "feedback.adminNote": adminNote }
              : {}),
          },
        },
        { new: true, runValidators: true },
      )
        .populate("user", "firstName lastName email")
        .populate("jobId", "title companyName")
        .lean();

      if (!application) return next(new ErrorResponse("Feedback not found", 404));
      return res.status(200).json({
        success: true,
        feedback: formatUserApplicationFeedback(application),
      });
    }

    const fb = await PlatformFeedback.findById(id);
    if (!fb) return next(new ErrorResponse("Feedback not found", 404));

    fb.status = status;
    fb.reviewedAt = new Date();
    if (adminNote !== undefined) fb.adminNote = adminNote;
    await fb.save();

    res.status(200).json({ success: true, feedback: fb });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/admin/feedback/:id ──────────────────────────────────────────
// Delete a recruiter platform entry or unset only an application's feedback subdocument.
exports.deleteFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id.startsWith("uf_")) {
      const application = await UserHistory.findOneAndUpdate(
        {
          _id: id.slice(3),
          feedback: { $exists: true, $ne: null },
        },
        { $unset: { feedback: 1 } },
      );
      if (!application) return next(new ErrorResponse("Feedback not found", 404));
      return res.status(200).json({
        success: true,
        message: "Application feedback deleted.",
      });
    }

    const fb = await PlatformFeedback.findByIdAndDelete(id);
    if (!fb) return next(new ErrorResponse("Feedback not found", 404));

    res.status(200).json({ success: true, message: "Feedback deleted." });
  } catch (error) {
    next(error);
  }
};
