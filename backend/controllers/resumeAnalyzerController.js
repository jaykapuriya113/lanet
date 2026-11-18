const path = require("path");
const User = require("../models/userModel");
const Job = require("../models/jobModel");
const ErrorResponse = require("../utils/errorResponse");
const { extractResumeText } = require("../utils/resumeExtractor");
const {
  analyzeResumeWithAI,
  scoreJobAgainstProfile,
  generatePreparationPlan,
} = require("../services/resumeAnalyzerService");

/**
 * Reuse the same URL-to-path conversion that userController already uses,
 * kept here inline to avoid cross-controller coupling.
 */
const resolveResumePath = (resumeUrl) => {
  if (typeof resumeUrl !== "string" || !resumeUrl) return null;

  let pathname = resumeUrl;
  try {
    pathname = new URL(resumeUrl).pathname;
  } catch {
    pathname = resumeUrl;
  }

  if (!pathname.includes("/uploads/")) return null;

  const uploadDir = path.resolve(__dirname, "../uploads");
  const fileName = path.basename(decodeURIComponent(pathname));
  const filePath = path.resolve(uploadDir, fileName);
  // Path traversal guard
  return filePath.startsWith(`${uploadDir}${path.sep}`) ? filePath : null;
};

/**
 * GET /api/user/resume-recommendations
 * Authenticated (isAuthenticated), user role only.
 *
 * Flow:
 *  1. Load the authenticated user and their resume URL
 *  2. Resolve to a filesystem path and extract raw PDF text
 *  3. Send text to Gemini → get structured profile
 *  4. Fetch all active jobs
 *  5. Score each job against the AI profile
 *  6. Sort by matchScore DESC, return top 20
 */
exports.getResumeRecommendations = async (req, res, next) => {
  try {
    // 1. Load user
    const user = await User.findById(req.user.id).select(
      "resume firstName lastName"
    );
    if (!user) return next(new ErrorResponse("User not found", 404));

    if (!user.resume) {
      return next(
        new ErrorResponse(
          "No resume found. Please upload your resume in Complete Profile.",
          400
        )
      );
    }

    // 2. Extract PDF text
    const filePath = resolveResumePath(user.resume);
    if (!filePath) {
      return next(new ErrorResponse("Invalid resume path.", 400));
    }

    const resumeText = await extractResumeText(filePath);
    if (!resumeText || resumeText.length < 50) {
      return next(
        new ErrorResponse(
          "Could not extract enough text from your resume PDF. Make sure your resume is a text-based PDF (not a scanned image).",
          400
        )
      );
    }

    // 3. AI analysis
    const resumeProfile = await analyzeResumeWithAI(resumeText);

    // 4. Fetch all active jobs
    const jobs = await Job.find({ isDeleted: false, available: true })
      .lean();

    if (!jobs.length) {
      return res.status(200).json({
        success: true,
        resumeProfile,
        recommendations: [],
      });
    }

    // 5. Score each job
    const scored = jobs.map((job) => {
      const { matchScore, matchedSkills, needsImprovementSkills, missingSkills, whyThisJob } =
        scoreJobAgainstProfile(resumeProfile, job);

      return {
        job: {
          _id: job._id,
          title: job.title,
          companyName: job.companyName,
          location: job.location,
          salary: job.salary,
          jobType: job.jobType,
          applicationDeadline: job.applicationDeadline,
        },
        matchScore,
        matchedSkills,
        needsImprovementSkills: needsImprovementSkills || [],
        missingSkills,
        whyThisJob,
      };
    });

    // 6. Sort and return top 20 with score > 0 first, then the rest
    const recommendations = scored
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 20);

    res.status(200).json({
      success: true,
      resumeProfile,
      recommendations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/user/prepare
 * Body: { jobId, matchedSkills[], missingSkills[] }
 * Authenticated. Generates an AI preparation plan for a specific job.
 */
exports.getPreparationPlan = async (req, res, next) => {
  try {
    const { jobId, matchedSkills = [], missingSkills = [] } = req.body;

    if (!jobId) return next(new ErrorResponse("jobId is required", 400));

    const job = await Job.findById(jobId).select(
      "title description AdditionalInformation"
    ).lean();
    if (!job) return next(new ErrorResponse("Job not found", 404));

    const plan = await generatePreparationPlan(job, matchedSkills, missingSkills);

    res.status(200).json({ success: true, plan });
  } catch (error) {
    next(error);
  }
};
