const ErrorResponse = require("../utils/errorResponse");
const UserPlatformFeedback = require("../models/userPlatformFeedbackModel");

const ensureUser = (req, res, next) => {
  if (!req.user || Number(req.user.role) !== 0) {
    return next(new ErrorResponse("Only candidates can submit platform feedback", 403));
  }
  return next();
};

exports.getUserPlatformFeedback = [
  ensureUser,
  async (req, res, next) => {
    try {
      const feedback = await UserPlatformFeedback.find({ user: req.user._id })
        .sort({ submittedAt: -1 })
        .lean();
      return res.status(200).json({ success: true, feedback });
    } catch (error) {
      return next(error);
    }
  },
];

exports.submitUserPlatformFeedback = [
  ensureUser,
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
      const savedFeedback = await UserPlatformFeedback.create({
        user: req.user._id,
        rating,
        feedback,
      });
      return res.status(201).json({ success: true, feedback: savedFeedback });
    } catch (error) {
      return next(error);
    }
  },
];