const Job = require("../models/jobModel");
const ErrorResponse = require("../utils/errorResponse");
const User = require("../models/userModel");
const UserHistory = require("../models/jobHistory");
const sendEmail = require("../utils/email");
const {
  normalizeApplicationStatus,
  addStatusHistoryEntry,
} = require("./jobsController");
const { createApplicationStatusNotification } = require("./jobsController");

exports.updateRecruiterApplicationStatus = async (req, res, next) => {
  try {
    const { applicationStatus } = req.body;
    const applicationId = req.params.applicationId;
    const normalizedStatus = normalizeApplicationStatus(applicationStatus);
    const allowedStatuses = [
      "pending",
      "under_review",
      "shortlisted",
      "interview",
      "selected",
      "accepted",
      "rejected",
    ];

    if (!allowedStatuses.includes(normalizedStatus)) {
      return next(new ErrorResponse("Invalid application status", 400));
    }
    const application = await UserHistory.findById(applicationId);
    if (!application) {
      return next(new ErrorResponse("Application not found", 404));
    }
    if (normalizedStatus === "interview" && !application.interview) {
      return next(
        new ErrorResponse(
          "Schedule an interview before setting this status",
          400,
        ),
      );
    }

    const job = await Job.findById(application.jobId);
    if (!job || String(job.user) !== String(req.user._id)) {
      return next(
        new ErrorResponse(
          "You do not have permission to update this application",
          403,
        ),
      );
    }

    const previousStatus = normalizeApplicationStatus(
      application.applicationStatus || "pending",
    );
    const statusChanged = previousStatus !== normalizedStatus;
    application.applicationStatus = normalizedStatus;

    if (statusChanged) {
      await addStatusHistoryEntry(application, normalizedStatus);
    }

    await application.save();

    await User.findByIdAndUpdate(
      application.user,
      { $addToSet: { jobsHistory: application._id } },
      { new: true },
    );

    if (statusChanged) {
      await createApplicationStatusNotification(
        application,
        job,
        normalizedStatus,
      );
    }

    if (normalizedStatus === "selected" || normalizedStatus === "accepted") {
      const user = await User.findById(application.user);
      if (user && user.email) {
        await sendEmail({
          email: user.email,
          subject: `Your application for ${application.title} has been selected.`,
        });
      }
    }

    return res.status(200).json({
      success: true,
      applicationStatus: normalizedStatus,
      application,
    });
  } catch (error) {
    return next(error);
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { applicationStatus } = req.body;
    const normalizedStatus = normalizeApplicationStatus(applicationStatus);
    const applicationId =
      req.body.applicationId || req.body.application || req.body.user;
    const currentApplication = await UserHistory.findById(applicationId);
    if (!currentApplication) {
      return res.status(404).json({ error: "Application not found" });
    }

    const job = await Job.findOne({
      _id: currentApplication.jobId,
      user: req.user._id,
      isDeleted: false,
    });
    if (!job) {
      return res.status(403).json({ error: "You do not own this application" });
    }

    const allowedStatuses = [
      "pending",
      "under_review",
      "shortlisted",
      "interview",
      "selected",
      "accepted",
      "rejected",
    ];
    if (!allowedStatuses.includes(normalizedStatus)) {
      return res.status(400).json({ error: "Invalid application status" });
    }
    if (normalizedStatus === "interview" && !currentApplication.interview) {
      return res.status(400).json({
        error: "Schedule an interview before setting this status",
      });
    }

    const previousStatus = normalizeApplicationStatus(
      currentApplication.applicationStatus || "pending",
    );
    const statusChanged = previousStatus !== normalizedStatus;
    currentApplication.applicationStatus = normalizedStatus;

    if (statusChanged) {
      await addStatusHistoryEntry(currentApplication, normalizedStatus);
    }

    await currentApplication.save();

    await User.findByIdAndUpdate(
      currentApplication.user,
      { $addToSet: { jobsHistory: currentApplication._id } },
      { new: true },
    );

    if (statusChanged) {
      await createApplicationStatusNotification(
        currentApplication,
        job,
        normalizedStatus,
      );
    }

    if (normalizedStatus === "selected" || normalizedStatus === "accepted") {
      const user = await User.findById(currentApplication.user);
      if (user && user.email) {
        await sendEmail({
          email: user.email,
          subject: `Your application with <b>JobApplied ID: </b>${currentApplication._id} ${currentApplication.title} is Accepted.`,
        });
      }
    }

    return res
      .status(200)
      .json({ success: true, applicationStatus: normalizedStatus });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
