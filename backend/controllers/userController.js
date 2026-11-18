const User = require("../models/userModel");
const Job = require("../models/jobModel");
const ErrorResponse = require("../utils/errorResponse");
const UserHistory = require("./../models/jobHistory");
const Notification = require("../models/notificationModel");
const sendEmail = require("../utils/email");
const { applicationConfirmationEmail } = require("../utils/emailTemplates");
const { calculateCandidateJobMatch } = require("../utils/jobMatch");
const fs = require("fs/promises");
const path = require("path");

const getStoredResumePath = (resumeUrl) => {
  if (typeof resumeUrl !== "string" || !resumeUrl) return null;

  let pathname = resumeUrl;
  try {
    pathname = new URL(resumeUrl).pathname;
  } catch (error) {
    pathname = resumeUrl;
  }

  if (!pathname.includes("/uploads/")) return null;

  const uploadDirectory = path.resolve(__dirname, "../uploads");
  const fileName = path.basename(decodeURIComponent(pathname));
  const filePath = path.resolve(uploadDirectory, fileName);
  return filePath.startsWith(`${uploadDirectory}${path.sep}`) ? filePath : null;
};

//load all user

exports.allUser = async (req, res, next) => {
  //pagination
  const page = Number(req.query.pageNumber) || 1;
  const pageSize = Number(req.query.pageSize) || 3;
  const count = await User.find({}).estimatedDocumentCount();

  try {
    const users = await User.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .select("-password")
      .skip(pageSize * (page - 1))
      .limit(pageSize);
    res.status(200).json({
      success: true,
      users,
      page,
      pages: Math.ceil(count / pageSize),
      count,
    });
    next();
  } catch (error) {
    return next(error);
  }
};

exports.ShowAllUser = async (req, res, next) => {
  try {
    const users = await User.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .select("-password");
    res.status(200).json({
      success: true,
      users,
    });
    next();
  } catch (error) {
    return next(error);
  }
};
//show single user
exports.singleUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    res.status(200).json({
      success: true,
      user,
    });
    next();
  } catch (error) {
    return next(error);
  }
};

//edit user
exports.editUser = async (req, res, next) => {
  try {
    // Role=1 recruiters: allow editing their own profile fields
    if (Number(req.user.role) === 1) {
      if (String(req.user._id) !== String(req.params.id)) {
        return next(new ErrorResponse("You can only edit your own profile", 403));
      }
      const recruiterEditableFields = ["firstName", "lastName", "phoneNumber", "profilePhoto", "companyName", "companyWebsite", "companyAddress"];
      const updates = {};
      recruiterEditableFields.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(req.body, field)) {
          updates[field] =
            typeof req.body[field] === "string"
              ? req.body[field].trim()
              : req.body[field];
        }
      });
      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updates },
        { new: true },
      ).select("-password");
      return res.status(200).json({ success: true, user: updatedUser });
    }

    if (Number(req.user.role) === 0) {
      if (String(req.user._id) !== String(req.params.id)) {
        return next(
          new ErrorResponse("You can only edit your own profile", 403),
        );
      }

      const currentUser = await User.findById(req.user._id);
      if (!currentUser) {
        return next(new ErrorResponse("User not found", 404));
      }

      const editableFields = [
        "firstName",
        "lastName",
        "phoneNumber",
        "contactDetails",
        "education",
        "skills",
        "experience",
        "profileInformation",
        "resume",
        "profilePhoto",
      ];
      const updates = {};
      editableFields.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(req.body, field)) {
          updates[field] =
            typeof req.body[field] === "string"
              ? req.body[field].trim()
              : req.body[field];
        }
      });

      const nextProfile = { ...currentUser.toObject(), ...updates };
      if (!nextProfile.firstName || !nextProfile.lastName) {
        return next(new ErrorResponse("Full name is required", 400));
      }
      if (
        nextProfile.firstName.length > 32 ||
        nextProfile.lastName.length > 32
      ) {
        return next(
          new ErrorResponse(
            "First and last name must be 32 characters or fewer",
            400,
          ),
        );
      }

      const normalizedPhone = String(nextProfile.phoneNumber || "").replace(
        /[\s().-]/g,
        "",
      );
      if (
        !/^\+?\d{8,15}$/.test(normalizedPhone) ||
        !/[1-9]/.test(normalizedPhone)
      ) {
        return next(
          new ErrorResponse(
            "Enter a valid contact number with 8 to 15 digits",
            400,
          ),
        );
      }
      if (
        !nextProfile.education ||
        !nextProfile.skills ||
        !nextProfile.experience
      ) {
        return next(
          new ErrorResponse(
            "Education, skills, and experience are required",
            400,
          ),
        );
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updates },
        { new: true },
      ).select("-password");

      const oldResumePath = getStoredResumePath(currentUser.resume);
      const newResumePath = getStoredResumePath(updatedUser.resume);
      if (oldResumePath && oldResumePath !== newResumePath) {
        await fs.unlink(oldResumePath).catch(() => {});
      }

      return res.status(200).json({ success: true, user: updatedUser });
    }

    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.status(200).json({
      success: true,
      user,
    });
    next();
  } catch (error) {
    return next(error);
  }
};

//delete user
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, {
      isDeleted: true,
    });
    res.status(200).json({
      success: true,
      message: "user deleted",
    });
    next();
  } catch (error) {
    return next(error);
  }
};

exports.getUserApplications = async (req, res, next) => {
  try {
    const applications = await UserHistory.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: "jobId",
        select: "title companyName location salary description user",
        populate: {
          path: "user",
          select: "firstName lastName companyName email",
        },
      })
      .populate({
        path: "user",
        select: "resume",
      })
      .lean();

    const formattedApplications = applications.map((application) => {
      const job = application.jobId || {};
      const statusHistory = Array.isArray(application.statusHistory)
        ? application.statusHistory
            .slice()
            .sort((first, second) => new Date(first.timestamp) - new Date(second.timestamp))
            .map((entry) => ({
              ...entry,
              status: entry.status,
              rawStatus: entry.rawStatus,
              timestamp: entry.timestamp,
            }))
        : [];

      return {
        _id: application._id,
        jobId: job._id || application.jobId,
        title: job.title || application.title,
        companyName: job.companyName || "N/A",
        location: job.location || application.location,
        salary: job.salary || application.salary,
        description: job.description || application.description,
        applicationStatus: application.applicationStatus || "pending",
        statusHistory,
        interview: application.interview || null,
        feedback: application.feedback || null,
        resume: application.resume || application.user?.resume || "",
        coverLetter: application.coverLetter,
        assessment: application.assessment,
        appliedDate: application.createdAt,
        createdAt: application.createdAt,
      };
    });

    return res.status(200).json({
      success: true,
      applications: formattedApplications,
    });
  } catch (error) {
    return next(error);
  }
};

exports.submitApplicationFeedback = async (req, res, next) => {
  try {
    if (Number(req.user.role) !== 0) {
      return next(new ErrorResponse("Only users can submit feedback", 403));
    }

    const answers = {
      overallExperience:
        typeof req.body.overallExperience === "string"
          ? req.body.overallExperience.trim()
          : "",
      likedMost:
        typeof req.body.likedMost === "string" ? req.body.likedMost.trim() : "",
      suggestedImprovements:
        typeof req.body.suggestedImprovements === "string"
          ? req.body.suggestedImprovements.trim()
          : "",
    };
    if (Object.values(answers).some((answer) => !answer || answer.length > 5000)) {
      return next(
        new ErrorResponse("Answer all three questions with responses under 5000 characters", 400),
      );
    }

    const existingApplication = await UserHistory.findOne({
      _id: req.params.applicationId,
      user: req.user._id,
    }).select("applicationStatus feedback jobId interview.status");
    if (!existingApplication) {
      return next(new ErrorResponse("Application not found", 404));
    }
    if (existingApplication.feedback) {
      return next(new ErrorResponse("Feedback has already been submitted", 409));
    }
    const application = await UserHistory.findOneAndUpdate(
      {
        _id: req.params.applicationId,
        user: req.user._id,
        feedback: { $exists: false },
      },
      {
        $set: {
          feedback: {
              ...answers,
              comment: [
                `What was your overall experience with the company?\n${answers.overallExperience}`,
                `What did you like most about the company and recruitment process?\n${answers.likedMost}`,
                `What improvements would you suggest for the company or recruitment process?\n${answers.suggestedImprovements}`,
              ].join("\n\n"),
            user: req.user._id,
            job: existingApplication.jobId,
            submittedAt: new Date(),
          },
        },
      },
      { new: true, runValidators: true },
    );

    if (!application) {
      return next(new ErrorResponse("Feedback has already been submitted", 409));
    }

    return res.status(201).json({
      success: true,
      feedback: application.feedback,
    });
  } catch (error) {
    return next(error);
  }
};

exports.respondToInterview = async (req, res, next) => {
  try {
    if (Number(req.user.role) !== 0) {
      return next(new ErrorResponse("Only users can respond to interviews", 403));
    }

    const { response } = req.body;
    if (!["accepted", "declined"].includes(response)) {
      return next(new ErrorResponse("Invalid interview response", 400));
    }

    const application = await UserHistory.findOneAndUpdate(
      {
        _id: req.params.applicationId,
        user: req.user._id,
        applicationStatus: "interview",
        "interview.date": { $exists: true },
        $or: [
          { "interview.response": { $exists: false } },
          { "interview.response": "pending" },
          { "interview.response.status": "pending" },
        ],
      },
      {
        $set: {
          "interview.response": response,
          "interview.respondedAt": new Date(),
        },
      },
      { new: true, runValidators: true },
    );

    if (!application) {
      const ownedApplication = await UserHistory.findOne({
        _id: req.params.applicationId,
        user: req.user._id,
      }).select("interview");
      if (!ownedApplication?.interview) {
        return next(new ErrorResponse("Scheduled interview not found", 404));
      }
      return next(
        new ErrorResponse("You have already responded to this interview", 409),
      );
    }

    const [candidate, job] = await Promise.all([
      User.findById(application.user).select("firstName lastName"),
      Job.findById(application.jobId).select("title companyName"),
    ]);
    if (!candidate || !job || !application.interview.recruiter) {
      return next(
        new ErrorResponse("Interview notification details are incomplete", 500),
      );
    }

    const candidateName =
      `${candidate.firstName || ""} ${candidate.lastName || ""}`.trim() ||
      "Candidate";
    const notification = {
      userId: application.interview.recruiter,
      applicationId: application._id,
      notificationType: "interview_response",
      responseAt: application.interview.respondedAt,
      candidateName,
      companyName: job.companyName,
      jobTitle: job.title,
      status: response,
      message: `Candidate ${candidateName} ${response} the interview for ${job.title}.`,
    };

    try {
      await Notification.updateOne(
        {
          userId: notification.userId,
          applicationId: notification.applicationId,
          notificationType: notification.notificationType,
          responseAt: notification.responseAt,
        },
        { $setOnInsert: notification },
        { upsert: true },
      );
    } catch (error) {
      if (error.code !== 11000) throw error;
    }

    return res.status(200).json({
      success: true,
      interview: application.interview,
    });
  } catch (error) {
    return next(error);
  }
};

const ensureInterviewResponseNotifications = async (recruiterId) => {
  const respondedApplications = await UserHistory.find({
    "interview.recruiter": recruiterId,
    "interview.response": { $in: ["accepted", "declined"] },
  })
    .select("user jobId interview updatedAt")
    .populate("user", "firstName lastName")
    .populate("jobId", "title companyName")
    .lean();

  for (const application of respondedApplications) {
    const candidateName =
      `${application.user?.firstName || ""} ${application.user?.lastName || ""}`.trim() ||
      "Candidate";
    const jobTitle = application.jobId?.title;
    const responseAt =
      application.interview.respondedAt || application.updatedAt;
    if (!jobTitle || !application.jobId?.companyName || !responseAt) continue;

    const response = application.interview.response;
    await Notification.updateOne(
      {
        userId: recruiterId,
        applicationId: application._id,
        notificationType: "interview_response",
        responseAt,
      },
      {
        $setOnInsert: {
          userId: recruiterId,
          applicationId: application._id,
          notificationType: "interview_response",
          responseAt,
          candidateName,
          companyName: application.jobId.companyName,
          jobTitle,
          status: response,
          message: `Candidate ${candidateName} ${response} the interview for ${jobTitle}.`,
        },
      },
      { upsert: true },
    );
  }
};

exports.getUserNotifications = async (req, res, next) => {
  try {
    if (Number(req.user.role) === 1) {
      await ensureInterviewResponseNotifications(req.user._id);
    }

    const userFilter = { userId: req.user._id };
    const [notifications, unreadCount] = await Promise.all([
      Notification.find(userFilter).sort({ createdAt: -1 }).lean(),
      Notification.countDocuments({ ...userFilter, isRead: false }),
    ]);

    return res.status(200).json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    return next(error);
  }
};

exports.getUnreadNotificationCount = async (req, res, next) => {
  try {
    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false,
    });
    return res.status(200).json({ success: true, unreadCount });
  } catch (error) {
    return next(error);
  }
};

exports.markUserNotificationAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.notificationId, userId: req.user._id },
      { $set: { isRead: true } },
      { new: true },
    );
    if (!notification) {
      return next(new ErrorResponse("Notification not found", 404));
    }

    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false,
    });
    return res.status(200).json({
      success: true,
      notification,
      unreadCount,
    });
  } catch (error) {
    return next(error);
  }
};

exports.markAllUserNotificationsAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { $set: { isRead: true } },
    );
    return res.status(200).json({ success: true, unreadCount: 0 });
  } catch (error) {
    return next(error);
  }
};

// jobs history
exports.createUserJobsHistory = async (req, res, next) => {
  const { title, description, salary, location, id, coverLetter, assessment } =
    req.body;
  try {
    const job = await Job.findById(id);
    if (!job) {
      return next(new ErrorResponse("Job not found", 404));
    }
    if (job.isDeleted) {
      return next(new ErrorResponse("This job is no longer available", 400));
    }
    if (Number(req.user.role) === 1) {
      return next(new ErrorResponse("Recruiters cannot apply to jobs", 403));
    }
    if (job.user.toString() === req.user._id.toString()) {
      return next(new ErrorResponse("You cannot apply to your own job", 400));
    }

    const existingApplication = await UserHistory.findOne({
      user: req.user._id,
      jobId: id,
    });
    if (existingApplication) {
      return res.status(409).json({
        success: false,
        message: "You have already applied for this job.",
      });
    }

    const currentUser = await User.findOne({ _id: req.user._id });
    if (!currentUser) {
      return next(new ErrorResponse("You must log in", 401));
    }

    const match = await calculateCandidateJobMatch(currentUser, job);
    const addJobHostory = {
      title,
      description,
      salary,
      location,
      resume: currentUser.resume || "",
      user: req.user._id,
      jobId: id,
      coverLetter,
      assessment,
      applicationStatus: "pending",
      matchScore: match.score,
      matchedSkills: match.matchedSkills,
      missingSkills: match.missingSkills,
      matchExplanation: match.explanation,
      statusHistory: [
        {
          status: "Applied",
          rawStatus: "pending",
          timestamp: new Date(),
        },
      ],
    };

    const userHistory = await UserHistory.create(addJobHostory);

    await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { jobsHistory: userHistory._id } },
      { new: true },
    );

    // Send application confirmation email — non-blocking, failure must not
    // undo the successfully saved application.
    setImmediate(async () => {
      try {
        const applicant = await User.findById(req.user._id).select(
          "email firstName lastName",
        );
        if (applicant && applicant.email) {
          const candidateName =
            `${applicant.firstName || ""} ${applicant.lastName || ""}`.trim() ||
            "Candidate";
          const { subject, html, text } = applicationConfirmationEmail({
            candidateName,
            jobTitle:        job.title,
            companyName:     job.companyName,
            applicationDate: userHistory.createdAt || new Date(),
            applicationId:   String(userHistory._id),
          });
          await sendEmail({ email: applicant.email, subject, html, text });
        }
      } catch (emailErr) {
        const category = emailErr.category || "EMAIL_ERROR";
        const hint     = emailErr.hint     || emailErr.message || "unknown";
        console.error(
          `[applyJob] Confirmation email failed (${category}): ${hint}`,
        );
      }
    });

    return res.status(200).json({
      success: true,
      currentUser: userHistory,
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already applied for this job.",
      });
    }
    return next(error);
  }
};
