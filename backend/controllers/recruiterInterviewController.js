const Job = require("../models/jobModel");
const ErrorResponse = require("../utils/errorResponse");
const User = require("../models/userModel");
const UserHistory = require("../models/jobHistory");
const Notification = require("../models/notificationModel");
const {
  normalizeApplicationStatus,
  addStatusHistoryEntry,
} = require("./jobsController");

const formatInterviewDate = (date) => {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatInterviewTime = (time) => {
  const [hour, minute] = time.split(":").map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
};

const createOrUpdateInterviewNotification = async (
  application,
  job,
  interview,
  rescheduled = false,
) => {
  const userId = application.user?._id || application.user;
  const companyName = job.companyName;
  const jobTitle = job.title;

  if (!userId || !companyName || !jobTitle) {
    throw new Error("Interview invitation details are incomplete");
  }

  const candidate = await User.findById(userId).select("firstName lastName");
  if (!candidate) {
    throw new ErrorResponse("Candidate not found for this application", 404);
  }

  const candidateName =
    `${candidate.firstName || ""} ${candidate.lastName || ""}`.trim();
  const interviewDate = formatInterviewDate(interview.date);
  const interviewTime = formatInterviewTime(interview.time);
  const message = rescheduled
    ? `${companyName} has updated your online interview invitation for ${jobTitle} to ${interviewDate} at ${interviewTime}.`
    : `${companyName} has invited you for an online interview for the ${jobTitle} position on ${interviewDate} at ${interviewTime}.`;
  const now = new Date();
  const notification = {
    userId,
    applicationId: application._id,
    notificationType: "interview",
    candidateName,
    companyName,
    jobTitle,
    status: "interview",
    interviewDate: interview.date,
    interviewTime: interview.time,
    interviewMode: interview.mode,
    meetingLink: interview.meetingLink,
    message,
    isRead: false,
    createdAt: now,
    updatedAt: now,
  };
  const existingInterviewNotification = {
    userId,
    applicationId: application._id,
    $or: [
      { notificationType: "interview" },
      { notificationType: { $exists: false }, status: "interview" },
    ],
  };

  try {
    return await Notification.findOneAndUpdate(
      existingInterviewNotification,
      { $set: notification },
      { new: true, upsert: true, runValidators: true, timestamps: false },
    );
  } catch (error) {
    if (error.code !== 11000) throw error;

    const updatedNotification = await Notification.findOneAndUpdate(
      { userId, applicationId: application._id, notificationType: "interview" },
      { $set: notification },
      { new: true, runValidators: true, timestamps: false },
    );
    if (!updatedNotification) throw error;
    return updatedNotification;
  }
};

const normalizeInterviewInput = (input = {}) => {
  const { date, time, mode, meetingLink } = input;
  const validDateFormat = /^\d{4}-\d{2}-\d{2}$/.test(date || "");
  const parsedDate = validDateFormat ? new Date(`${date}T00:00:00.000Z`) : null;
  const interviewDateTime = new Date(`${date}T${time}:00`);
  const validTime = /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time || "");
  let parsedLink;

  try {
    parsedLink = new URL(String(meetingLink || "").trim());
  } catch (error) {
    parsedLink = null;
  }

  if (
    !validDateFormat ||
    !parsedDate ||
    parsedDate.toISOString().slice(0, 10) !== date ||
    !Number.isFinite(interviewDateTime.getTime()) ||
    interviewDateTime <= new Date()
  ) {
    throw new ErrorResponse(
      "Choose a valid interview date that is not in the past",
      400,
    );
  }
  if (!validTime) {
    throw new ErrorResponse("Choose a valid interview time", 400);
  }
  if (mode !== "online") {
    throw new ErrorResponse("Choose an interview mode", 400);
  }
  if (
    !parsedLink ||
    !["http:", "https:"].includes(parsedLink.protocol) ||
    !parsedLink.hostname
  ) {
    throw new ErrorResponse("Enter a valid meeting link", 400);
  }

  return {
    date,
    time,
    mode: "online",
    meetingLink: parsedLink.toString(),
  };
};

const getRecruiterOwnedApplication = async (applicationId, recruiterId) => {
  const application = await UserHistory.findById(applicationId);
  if (!application) {
    throw new ErrorResponse("Application not found", 404);
  }

  const job = await Job.findById(application.jobId);
  if (!job || String(job.user) !== String(recruiterId)) {
    throw new ErrorResponse(
      "You do not have permission to manage this interview",
      403,
    );
  }

  return { application, job };
};

exports.scheduleRecruiterInterview = async (req, res, next) => {
  try {
    const interviewInput = normalizeInterviewInput(req.body);
    const { application, job } = await getRecruiterOwnedApplication(
      req.params.applicationId,
      req.user._id,
    );

    if (application.interview) {
      return next(new ErrorResponse("Interview already scheduled.", 409));
    }
    if (application.applicationStatus !== "shortlisted") {
      return next(
        new ErrorResponse("Only shortlisted candidates can be scheduled", 400),
      );
    }

    const hasInterviewHistoryEntry = (application.statusHistory || []).some(
      (entry) =>
        entry.rawStatus === "interview" ||
        normalizeApplicationStatus(entry.status) === "interview",
    );
    if (!hasInterviewHistoryEntry) {
      await addStatusHistoryEntry(application, "interview");
    }

    const updatedApplication = await UserHistory.findOneAndUpdate(
      {
        _id: application._id,
        applicationStatus: "shortlisted",
        "interview.date": { $exists: false },
      },
      {
        $set: {
          interview: {
            ...interviewInput,
            recruiter: req.user._id,
            response: "pending",
          },
          applicationStatus: "interview",
          statusHistory: application.statusHistory || [],
        },
      },
      { new: true, runValidators: true },
    );

    if (!updatedApplication) {
      const latestApplication = await UserHistory.findById(application._id);
      if (latestApplication?.interview) {
        return next(new ErrorResponse("Interview already scheduled.", 409));
      }
      return next(
        new ErrorResponse("Only shortlisted candidates can be scheduled", 400),
      );
    }

    await User.findByIdAndUpdate(updatedApplication.user, {
      $addToSet: { jobsHistory: updatedApplication._id },
    });
    await createOrUpdateInterviewNotification(
      updatedApplication,
      job,
      updatedApplication.interview,
    );

    return res.status(201).json({
      success: true,
      application: updatedApplication,
      interview: updatedApplication.interview,
    });
  } catch (error) {
    return next(error);
  }
};

exports.rescheduleRecruiterInterview = async (req, res, next) => {
  try {
    const interviewInput = normalizeInterviewInput(req.body);
    const { application, job } = await getRecruiterOwnedApplication(
      req.params.applicationId,
      req.user._id,
    );

    if (!application.interview) {
      return next(
        new ErrorResponse(
          "No interview is scheduled for this application",
          404,
        ),
      );
    }

    const updatedApplication = await UserHistory.findOneAndUpdate(
      { _id: application._id, "interview.recruiter": req.user._id },
      {
        $set: {
          interview: {
            ...interviewInput,
            recruiter: req.user._id,
            response: "pending",
          },
          applicationStatus: "interview",
        },
      },
      { new: true, runValidators: true },
    );
    if (!updatedApplication) {
      return next(new ErrorResponse("Interview could not be updated", 409));
    }

    await createOrUpdateInterviewNotification(
      updatedApplication,
      job,
      updatedApplication.interview,
      true,
    );

    return res.status(200).json({
      success: true,
      application: updatedApplication,
      interview: updatedApplication.interview,
    });
  } catch (error) {
    return next(error);
  }
};

exports.completeRecruiterInterview = async (req, res, next) => {
  try {
    const { application } = await getRecruiterOwnedApplication(
      req.params.applicationId,
      req.user._id,
    );

    if (!application.interview) {
      return next(new ErrorResponse("No interview is scheduled", 404));
    }
    if (application.interview.status === "completed") {
      return next(new ErrorResponse("Interview is already completed", 409));
    }
    if (
      !["pending", "accepted"].includes(
        application.interview.response || "pending",
      )
    ) {
      return next(
        new ErrorResponse(
          "Only a scheduled or accepted interview can be completed",
          400,
        ),
      );
    }

    const completedApplication = await UserHistory.findOneAndUpdate(
      {
        _id: application._id,
        "interview.recruiter": req.user._id,
        "interview.date": { $exists: true },
        "interview.status": { $ne: "completed" },
        "interview.response": { $in: ["pending", "accepted"] },
      },
      { $set: { "interview.status": "completed" } },
      { new: true, runValidators: true },
    );

    if (!completedApplication) {
      return next(
        new ErrorResponse(
          "Interview is already completed or is no longer eligible",
          409,
        ),
      );
    }

    return res.status(200).json({
      success: true,
      interview: completedApplication.interview,
    });
  } catch (error) {
    return next(error);
  }
};
