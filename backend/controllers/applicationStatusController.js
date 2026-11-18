const Job = require("../models/jobModel");
const ErrorResponse = require("../utils/errorResponse");
const User = require("../models/userModel");
const UserHistory = require("../models/jobHistory");
const sendEmail = require("../utils/email");
const { applicationStatusEmail } = require("../utils/emailTemplates");
const {
  normalizeApplicationStatus,
  addStatusHistoryEntry,
} = require("./jobsController");
const { createApplicationStatusNotification } = require("./jobsController");

const maskEmail = (email) => {
  const [localPart, domain] = String(email).split("@");
  if (!localPart || !domain) return "invalid-address";
  return `${localPart[0]}***@${domain}`;
};

const persistApplicationStatus = async (application, status) => {
  const previousRawStatus = application.applicationStatus;
  const previousStatus = normalizeApplicationStatus(
    previousRawStatus || "pending",
  );
  if (previousStatus === status) {
    return { application, statusChanged: false };
  }

  const historyChanged = await addStatusHistoryEntry(application, status);
  const update = { $set: { applicationStatus: status } };
  if (historyChanged) {
    update.$push = {
      statusHistory: application.statusHistory[application.statusHistory.length - 1],
    };
  }

  const updatedApplication = await UserHistory.findOneAndUpdate(
    {
      _id: application._id,
      applicationStatus:
        previousStatus === "pending"
          ? { $in: [null, "pending"] }
          : previousRawStatus,
    },
    update,
    { new: true, runValidators: true },
  );
  if (updatedApplication) {
    return { application: updatedApplication, statusChanged: true };
  }

  const latestApplication = await UserHistory.findById(application._id);
  if (
    latestApplication &&
    normalizeApplicationStatus(
      latestApplication.applicationStatus || "pending",
    ) === status
  ) {
    return { application: latestApplication, statusChanged: false };
  }

  throw new ErrorResponse(
    "Application status changed concurrently. Refresh and try again.",
    409,
  );
};

const sendApplicationStatusEmail = async (application, job, status) => {
  const candidateUserId = application.user?._id || application.user;
  console.info("[email] applicationStatusEmail attempted:", {
    applicationId: String(application._id),
    candidateUserId: String(candidateUserId || ""),
    status,
  });

  try {
    const user = await User.findById(candidateUserId).select(
      "email firstName lastName",
    );
    if (!user || !user.email) {
      throw new Error("Candidate email is missing from the user record");
    }
    const recipient = user.email.trim();

    const candidateName =
      `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Candidate";
    const { subject, html, text } = applicationStatusEmail({
      candidateName,
      jobTitle: job.title || application.title || "your applied position",
      companyName: job.companyName,
      applicationStatus: status,
      applicationId: String(application._id),
    });

    console.info("[email] applicationStatusEmail SMTP send attempted:", {
      applicationId: String(application._id),
      recipient: maskEmail(recipient),
    });
    const delivery = await sendEmail({
      email: recipient,
      subject,
      html,
      text,
    });
    const accepted = Array.isArray(delivery?.accepted)
      ? delivery.accepted.some(
          (address) =>
            String(address).toLowerCase() === recipient.toLowerCase(),
        )
      : false;

    if (!accepted) {
      const error = new Error(
        "SMTP provider did not accept the candidate email address",
      );
      error.category = "RECIPIENT_REJECTED";
      error.recipient = recipient;
      error.responseCode = delivery?.responseCode;
      error.response = delivery?.response;
      throw error;
    }

    console.info("[email] applicationStatusEmail accepted by SMTP provider:", {
      applicationId: String(application._id),
      recipient: maskEmail(recipient),
      messageId: delivery.messageId,
    });
    return "accepted";
  } catch (error) {
    console.error("[email] applicationStatusEmail failed:", {
      applicationId: String(application._id),
      candidateUserId: String(candidateUserId || ""),
      status,
      recipient: error.recipient ? maskEmail(error.recipient) : undefined,
      category: error.category,
      message: error.message,
      code: error.code,
      responseCode: error.responseCode,
      command: error.command,
      response: error.response,
      hint: error.hint,
      stack: error.stack,
    });
    return "failed";
  }
};

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
    let application = await UserHistory.findById(applicationId);
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

    const updateResult = await persistApplicationStatus(
      application,
      normalizedStatus,
    );
    application = updateResult.application;

    const emailStatus = updateResult.statusChanged
      ? await sendApplicationStatusEmail(application, job, normalizedStatus)
      : "not_attempted";
    await User.findByIdAndUpdate(
      application.user,
      { $addToSet: { jobsHistory: application._id } },
      { new: true },
    );

    if (updateResult.statusChanged) {
      await createApplicationStatusNotification(
        application,
        job,
        normalizedStatus,
      );
    }

    return res.status(200).json({
      success: true,
      applicationStatus: normalizedStatus,
      emailNotification: { status: emailStatus },
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
    let currentApplication = await UserHistory.findById(applicationId);
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

    const updateResult = await persistApplicationStatus(
      currentApplication,
      normalizedStatus,
    );
    currentApplication = updateResult.application;

    const emailStatus = updateResult.statusChanged
      ? await sendApplicationStatusEmail(
        currentApplication,
        job,
        normalizedStatus,
      )
      : "not_attempted";
    await User.findByIdAndUpdate(
      currentApplication.user,
      { $addToSet: { jobsHistory: currentApplication._id } },
      { new: true },
    );

    if (updateResult.statusChanged) {
      await createApplicationStatusNotification(
        currentApplication,
        job,
        normalizedStatus,
      );
    }

    return res
      .status(200)
      .json({
        success: true,
        applicationStatus: normalizedStatus,
        emailNotification: { status: emailStatus },
      });
  } catch (error) {
    return res
      .status(error.codeStatus || 400)
      .json({ error: error.message });
  }
};
