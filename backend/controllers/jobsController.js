const Job = require("../models/jobModel");
const JobType = require("../models/jobTypeModel");
const ErrorResponse = require("../utils/errorResponse");
const User = require("../models/userModel");
const UserHistory = require("../models/jobHistory");
const Notification = require("../models/notificationModel");
const sendEmail = require("../utils/email");
const { calculateJobMatch } = require("../utils/jobMatch");
const validateApplicationDeadline = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ErrorResponse("Application Deadline must be a valid date.", 400);
  }

  const [year, month, day] = value.split("-").map(Number);
  const deadline = new Date(Date.UTC(year, month - 1, day));
  if (
    deadline.getUTCFullYear() !== year ||
    deadline.getUTCMonth() !== month - 1 ||
    deadline.getUTCDate() !== day
  ) {
    throw new ErrorResponse("Application Deadline must be a valid date.", 400);
  }

  if (value < new Date().toISOString().slice(0, 10)) {
    throw new ErrorResponse("Application Deadline cannot be in the past.", 400);
  }

  return deadline;
};

//create jobtype
exports.createJob = async (req, res, next) => {
  try {
    const job = await Job.create({
      title: req.body.title,
      description: req.body.description,
      salary: req.body.salary,
      companyName: req.body.companyName,
      location: req.body.location,
      applicationDeadline: validateApplicationDeadline(
        req.body.applicationDeadline,
      ),
      AdditionalInformation: req.body.AdditionalInformation,
      jobType: req.body.jobType,
      user: req.user.id,
    });

    const [jobCategory, users] = await Promise.all([
      JobType.findById(job.jobType).select("jobTypeName"),
      User.find({
        role: 0,
        isDeleted: { $ne: true },
        _id: { $ne: req.user._id },
      }).select(
        "firstName lastName skills education experience profileInformation resume contactDetails",
      ),
    ]);
    const matchingUsers = users.filter(
      (user) =>
        calculateJobMatch(user, {
          ...job.toObject(),
          title: `${job.title} ${jobCategory?.jobTypeName || ""}`,
        }).matchedSkills.length > 0,
    );

    if (matchingUsers.length) {
      await Notification.bulkWrite(
        matchingUsers.map((user) => ({
          updateOne: {
            filter: {
              userId: user._id,
              jobId: job._id,
              notificationType: "new_job",
            },
            update: {
              $setOnInsert: {
                userId: user._id,
                jobId: job._id,
                notificationType: "new_job",
                companyName: job.companyName,
                jobTitle: job.title,
                status: "new_job",
                message: `A new job matching your profile is available: ${job.title} at ${job.companyName}.`,
              },
            },
            upsert: true,
          },
        })),
        { ordered: false },
      );
    }

    res.status(201).json({
      success: true,
      job,
    });
  } catch (error) {
    next(error);
  }
};

//single job
exports.singleJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).populate(
      "user",
      "_id role profilePhoto firstName",
    );

    res.status(200).json({
      success: true,
      job: job ? job.toObject() : job,
    });
  } catch (error) {
    next(error);
  }
};

//update job by id.
exports.updateJob = async (req, res, next) => {
  try {
    if (Object.prototype.hasOwnProperty.call(req.body, "applicationDeadline")) {
      req.body.applicationDeadline = validateApplicationDeadline(
        req.body.applicationDeadline,
      );
    }

    console.log("object");
    const job = await Job.findByIdAndUpdate(req.params.job_id, req.body, {
      new: true,
    }).populate("user", "firstName lastName");
    console.log(job);
    res.status(200).json({
      success: true,
      job,
    });
    console.log(job);
  } catch (error) {
    next(error);
  }
};

//delete job
exports.deleteJobs = async (req, res, next) => {
  try {
    const jobT = await Job.findByIdAndUpdate(req.params.id, {
      isDeleted: true,
    });
    res.status(200).json({
      success: true,
      message: "Job deleted",
    });
  } catch (error) {
    next(new ErrorResponse("server error", 500));
  }
};

const normalizeApplicationStatus = (status) => {
  if (!status) return "pending";
  return status.trim();
};

const getApplicationStatusHistoryLabel = (status) => {
  const labels = {
    pending: "Applied",
    applied: "Applied",
    under_review: "Under Review",
    shortlisted: "Shortlisted",
    interview: "Interview",
    selected: "Selected",
    accepted: "Selected",
    rejected: "Rejected",
  };

  return labels[status] || "Applied";
};

const getApplicationStatusLabel = (status) => {
  const labels = {
    pending: "Applied",
    under_review: "Under Review",
    shortlisted: "Shortlisted",
    interview: "Interview",
    selected: "Selected",
    accepted: "Selected",
    rejected: "Rejected",
  };
  return labels[status] || status.replace(/[_-]/g, " ");
};

const createApplicationStatusNotification = async (
  application,
  job,
  status,
  message,
) => {
  const userId = application.user?._id || application.user;
  const companyName = job.companyName;
  const jobTitle = job.title;
  const statusLabel = getApplicationStatusLabel(status);

  if (!userId || !companyName || !jobTitle) {
    throw new Error("Application notification details are incomplete");
  }

  await Notification.create({
    userId,
    applicationId: application._id,
    companyName,
    jobTitle,
    status,
    message:
      message ||
      `${companyName} has updated your application status for ${jobTitle} to ${statusLabel}.`,
  });
};

exports.createApplicationStatusNotification = createApplicationStatusNotification;

const addStatusHistoryEntry = async (application, nextStatus) => {
  if (!application || !nextStatus) return false;

  const normalizedStatus = normalizeApplicationStatus(nextStatus);
  const currentHistory = Array.isArray(application.statusHistory)
    ? application.statusHistory
    : [];
  const lastEntry = currentHistory[currentHistory.length - 1];

  if (lastEntry && lastEntry.rawStatus === normalizedStatus) {
    return false;
  }

  const statusLabel = getApplicationStatusHistoryLabel(normalizedStatus);
  const newEntry = {
    status: statusLabel,
    rawStatus: normalizedStatus,
    timestamp: new Date(),
  };

  application.statusHistory = [...currentHistory, newEntry];
  return true;
};

exports.normalizeApplicationStatus = normalizeApplicationStatus;
exports.addStatusHistoryEntry = addStatusHistoryEntry;

