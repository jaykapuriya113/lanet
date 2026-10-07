const ErrorResponse = require("../utils/errorResponse");
const PlatformFeedback = require("../models/platformFeedbackModel");

const ensureRecruiter = (req, res, next) => {
  if (!req.user || Number(req.user.role) !== 1) {
    return next(
      new ErrorResponse("Only recruiters can submit platform feedback", 403),
    );
  }
  return next();
};

exports.getRecruiterPlatformFeedback = [
  ensureRecruiter,
  async (req, res, next) => {
    try {
      const feedback = await PlatformFeedback.findOne({
        recruiter: req.user._id,
      }).lean();
      return res.status(200).json({ success: true, feedback });
    } catch (error) {
      return next(error);
    }
  },
];

exports.submitRecruiterPlatformFeedback = [
  ensureRecruiter,
  async (req, res, next) => {
    const rating = Number(req.body.rating);
    const feedback =
      typeof req.body.feedback === "string" ? req.body.feedback.trim() : "";

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return next(new ErrorResponse("Rating must be between 1 and 5", 400));
    }
    if (!feedback || feedback.length > 2000) {
      return next(
        new ErrorResponse("Feedback must be between 1 and 2000 characters", 400),
      );
    }

    try {
      const savedFeedback = await PlatformFeedback.create({
        recruiter: req.user._id,
        rating,
        feedback,
      });
      return res.status(201).json({
        success: true,
        feedback: savedFeedback,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          error: "You have already submitted platform feedback.",
        });
      }
      return next(error);
    }
  },
];
