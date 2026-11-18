const fs = require("fs");
const path = require("path");
const Job = require("../models/jobModel");
const ErrorResponse = require("../utils/errorResponse");
const User = require("../models/userModel");
const UserHistory = require("../models/jobHistory");
const { calculateCandidateJobMatch } = require("../utils/jobMatch");

const calculateAndSaveApplicationMatch = async (application, applicant, job) => {
  if (Number.isFinite(application.matchScore)) {
    return {
      score: application.matchScore,
      matchedSkills: application.matchedSkills || [],
      missingSkills: application.missingSkills || [],
      explanation: application.matchExplanation || "",
    };
  }

  const match = await calculateCandidateJobMatch(
    { ...applicant, resume: application.resume || applicant.resume },
    job,
  );
  await UserHistory.updateOne(
    { _id: application._id },
    {
      $set: {
        matchScore: match.score,
        matchedSkills: match.matchedSkills,
        missingSkills: match.missingSkills,
        matchExplanation: match.explanation,
      },
    },
  );
  return match;
};

//apply user user find by id
exports.showAdminUserApplyJob = async (req, res, next) => {
  try {
    const id = req.params.id;

    const jobs = await Job.find({
      user: id,
    });

    res.status(200).json({
      success: true,
      jobs,
    });
  } catch (error) {
    next(error);
  }
};

exports.adminShowUserApplyJob = async (req, res, next) => {
  try {
    const availableJobs = await Job.find({
      user: req.user._id,
      isDeleted: false,
    })
      .populate({
        path: "userAppliedForJob",
        select:
          "_id  title description salary location interviewDate applicationStatus companyName coverLetter assessment",
        populate: {
          path: "user",
          select: "firstName lastName email resume",
        },
      })
      .lean();

    return res.status(200).json({
      availableJobs,
    });
  } catch (error) {
    next(error);
  }
};

const getApplicationResumePath = (resumeUrl) => {
  if (!resumeUrl) return "";
  const cleanedUrl = resumeUrl.split("?")[0];

  if (cleanedUrl.startsWith("http://") || cleanedUrl.startsWith("https://")) {
    const parsedUrl = new URL(cleanedUrl);
    const pathname = decodeURIComponent(parsedUrl.pathname);
    const uploadsValue = pathname.replace(/^\/+/, "");
    if (uploadsValue.startsWith("uploads/")) {
      return path.join(__dirname, "..", uploadsValue);
    }
    return path.join(__dirname, "..", "uploads", path.basename(pathname));
  }

  if (cleanedUrl.startsWith("/")) {
    return path.join(__dirname, "..", cleanedUrl.replace(/^\/+/, ""));
  }

  return path.join(__dirname, "..", "uploads", path.basename(cleanedUrl));
};

const getResumeFileName = (resumeUrl) => {
  if (!resumeUrl) return "resume.pdf";

  try {
    const cleanedUrl = resumeUrl.split("?")[0];
    const parsedUrl = new URL(cleanedUrl);
    const fileName = path.basename(decodeURIComponent(parsedUrl.pathname));
    return fileName || "resume.pdf";
  } catch (error) {
    const fallback = resumeUrl.split("/").pop() || "resume.pdf";
    return decodeURIComponent(fallback);
  }
};

const isPopulatedRef = (value, fields) =>
  value &&
  typeof value === "object" &&
  fields.some((field) => value[field] !== undefined);

const hydrateRecruiterApplicationRefs = async (application) => {
  const userRefId =
    application.user?._id ||
    application.user ||
    application.userId?._id ||
    application.userId;
  const jobRefId =
    application.jobId?._id ||
    application.jobId ||
    application.job?._id ||
    application.job;
  const populatedUser = [application.user, application.userId].find((value) =>
    isPopulatedRef(value, ["firstName", "lastName", "email"]),
  );
  const populatedJob = [application.jobId, application.job].find((value) =>
    isPopulatedRef(value, ["title", "companyName"]),
  );

  const [resolvedUser, resolvedJob] = await Promise.all([
    userRefId && !populatedUser
      ? User.findById(userRefId)
          .select(
            "firstName lastName email phoneNumber education skills experience profileInformation contactDetails resume profilePhoto",
          )
          .lean()
      : Promise.resolve(populatedUser || null),
    jobRefId && !populatedJob
      ? Job.findById(jobRefId)
          .select(
            "_id title companyName location salary description AdditionalInformation",
          )
          .lean()
      : Promise.resolve(populatedJob || null),
  ]);

  return {
    ...application,
    user: resolvedUser || application.user || null,
    jobId: resolvedJob || application.jobId || null,
  };
};

exports.getRecruiterApplications = async (req, res, next) => {
  try {
    const recruiterJobs = await Job.find({
      user: req.user._id,
      isDeleted: false,
    }).select("_id");

    const jobIds = recruiterJobs.map((job) => job._id);
    const applications = await UserHistory.find({
      jobId: { $in: jobIds },
    })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select:
          "firstName lastName email phoneNumber education skills experience profileInformation contactDetails resume profilePhoto",
      })
      .populate({
        path: "jobId",
        select:
          "_id title companyName location salary description AdditionalInformation",
      })
      .lean();

    const hydratedApplications = await Promise.all(
      applications.map((application) =>
        hydrateRecruiterApplicationRefs(application),
      ),
    );

    const responsePayload = {
      success: true,
      applications: await Promise.all(
        hydratedApplications.map(async (application) => {
          const applicant = application.user || {};
          const job = application.jobId || {};
          const generatedApplicantName =
            applicant.firstName || applicant.lastName
              ? `${applicant.firstName || ""} ${applicant.lastName || ""}`.trim()
              : application.applicantName || "Unknown applicant";
          const match = await calculateAndSaveApplicationMatch(
            application,
            applicant,
            job,
          );

          return {
            ...application,
            applicantName: generatedApplicantName,
            applicantFirstName: applicant.firstName || "",
            applicantLastName: applicant.lastName || "",
            applicantEmail:
              applicant.email || application.email || "Not available",
            email: applicant.email || application.email || "Not available",
            jobTitle: job.title || application.title || "Not available",
            jobCompany: job.companyName || "Not available",
            jobLocation: job.location || application.location || "Not available",
            resumeName: applicant.resume
              ? getResumeFileName(applicant.resume)
              : "No resume uploaded",
            matchScore: match.score,
            matchedSkills: match.matchedSkills,
            missingSkills: match.missingSkills,
            matchExplanation: match.explanation,
          };
        }),
      ),
    };

    return res.status(200).json(responsePayload);
  } catch (error) {
    return next(error);
  }
};

exports.getRecruiterApplicationById = async (req, res, next) => {
  try {
    const application = await UserHistory.findById(req.params.applicationId)
      .populate({
        path: "user",
        select:
          "firstName lastName email phoneNumber education skills experience profileInformation contactDetails resume profilePhoto",
      })
      .populate({
        path: "jobId",
        select:
          "_id title companyName location salary description AdditionalInformation user",
      })
      .lean();

    if (!application) {
      return next(new ErrorResponse("Application not found", 404));
    }

    const hydratedApplication =
      await hydrateRecruiterApplicationRefs(application);
    const job = hydratedApplication.jobId;
    if (!job || String(job.user) !== String(req.user._id)) {
      return next(
        new ErrorResponse(
          "You do not have access to this applicant profile",
          403,
        ),
      );
    }

    const match = await calculateAndSaveApplicationMatch(
      hydratedApplication,
      hydratedApplication.user || {},
      hydratedApplication.jobId || {},
    );

    return res.status(200).json({
      success: true,
      application: {
        ...hydratedApplication,
        applicantName: hydratedApplication.user
          ? `${hydratedApplication.user.firstName || ""} ${hydratedApplication.user.lastName || ""}`.trim() ||
            "Unknown applicant"
          : "Unknown applicant",
        applicantFirstName: hydratedApplication.user?.firstName || "",
        applicantLastName: hydratedApplication.user?.lastName || "",
        applicantEmail:
          hydratedApplication.user?.email ||
          hydratedApplication.email ||
          "Not available",
        email:
          hydratedApplication.user?.email ||
          hydratedApplication.email ||
          "Not available",
        jobTitle:
          hydratedApplication.jobId?.title ||
          hydratedApplication.title ||
          "Not available",
        jobCompany: hydratedApplication.jobId?.companyName || "Not available",
        jobLocation:
          hydratedApplication.jobId?.location ||
          hydratedApplication.location ||
          "Not available",
        resumeName: hydratedApplication.user?.resume
          ? getResumeFileName(hydratedApplication.user.resume)
          : "No resume uploaded",
        matchScore: match.score,
        matchedSkills: match.matchedSkills,
        missingSkills: match.missingSkills,
        matchExplanation: match.explanation,
      },
    });
  } catch (error) {
    return next(error);
  }
};

exports.getSuitableCandidatesForJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findOne({
      _id: jobId,
      user: req.user._id,
      isDeleted: false,
    }).lean();

    if (!job) {
      return next(new ErrorResponse("Job not found or access denied", 404));
    }

    const applications = await UserHistory.find({ jobId: job._id })
      .populate({
        path: "user",
        select:
          "firstName lastName email phoneNumber education skills experience profileInformation contactDetails resume profilePhoto",
      })
      .sort({ createdAt: -1 })
      .lean();

    const candidates = (
      await Promise.all(
        applications.map(async (application) => {
          const applicant = application.user || {};
          const mainMatch = await calculateAndSaveApplicationMatch(
            application,
            applicant,
            job,
          );
          const fullName =
            `${applicant.firstName || ""} ${applicant.lastName || ""}`.trim();

          return {
            applicationId: application._id,
            userId: applicant._id || application.user,
            name: fullName || "Unknown applicant",
            email: applicant.email || "Not available",
            score: mainMatch.score,
            matchedSkills: mainMatch.matchedSkills,
            missingSkills: mainMatch.missingSkills,
            explanation: mainMatch.explanation,
            applicationStatus: application.applicationStatus || "pending",
            resume: applicant.resume || "",
            resumeName: applicant.resume
              ? getResumeFileName(applicant.resume)
              : "No resume uploaded",
            profileSummary:
              applicant.profileInformation ||
              applicant.education ||
              applicant.experience ||
              "No profile details provided",
          };
        }),
      )
    ).sort((first, second) => {
      const firstScore = Number.isFinite(first.score) ? first.score : -1;
      const secondScore = Number.isFinite(second.score) ? second.score : -1;
      return secondScore - firstScore;
    });

    return res.status(200).json({
      success: true,
      job: {
        _id: job._id,
        title: job.title,
        companyName: job.companyName,
        location: job.location,
        salary: job.salary,
      },
      candidates,
    });
  } catch (error) {
    return next(error);
  }
};

exports.getRecruiterApplicationResume = async (req, res, next) => {
  try {
    const application = await UserHistory.findById(req.params.applicationId)
      .populate({
        path: "user",
        select: "resume",
      })
      .populate({
        path: "jobId",
        select: "user",
      });

    if (!application) {
      return next(new ErrorResponse("Application not found", 404));
    }

    const job = application.jobId;
    const jobOwnerId = job?.user?._id || job?.user;
    if (!job || String(jobOwnerId) !== String(req.user._id)) {
      return next(
        new ErrorResponse("You do not have access to this resume", 403),
      );
    }

    const resumeUrl = application.user && application.user.resume;
    if (!resumeUrl) {
      return next(
        new ErrorResponse("No resume uploaded for this applicant", 404),
      );
    }

    if (/^https?:\/\//i.test(resumeUrl)) {
      const resumePath = new URL(resumeUrl).pathname;
      if (!resumePath.startsWith("/uploads/")) {
        return res.redirect(resumeUrl);
      }
    }

    const absolutePath = getApplicationResumePath(resumeUrl);
    if (!absolutePath || !fs.existsSync(absolutePath)) {
      return next(new ErrorResponse("Resume file could not be found", 404));
    }

    const fileName = path.basename(absolutePath) || "resume";
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    return res.sendFile(absolutePath);
  } catch (error) {
    return next(error);
  }
};
