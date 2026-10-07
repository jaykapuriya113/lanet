const Job = require("../models/jobModel");
const SavedJob = require("../models/savedJobModel");
const ErrorResponse = require("../utils/errorResponse");

const requireUser = (req, next) => {
  if (!req.user || Number(req.user.role) !== 0) {
    next(new ErrorResponse("Only users can save jobs", 403));
    return false;
  }
  return true;
};

exports.getSavedJobs = async (req, res, next) => {
  if (!requireUser(req, next)) return;

  try {
    const savedJobs = await SavedJob.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: "job",
        match: { isDeleted: false },
        populate: { path: "user", select: "firstName lastName profilePhoto" },
      });

    res.status(200).json({
      success: true,
      savedJobs: savedJobs.filter((savedJob) => savedJob.job),
    });
  } catch (error) {
    next(error);
  }
};

exports.saveJob = async (req, res, next) => {
  if (!requireUser(req, next)) return;

  try {
    const job = await Job.findOne({ _id: req.params.jobId, isDeleted: false });
    if (!job) return next(new ErrorResponse("Job not found", 404));

    const savedJobRecord = await SavedJob.findOneAndUpdate(
      { user: req.user._id, job: job._id },
      { user: req.user._id, job: job._id },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    const savedJob = await SavedJob.findById(savedJobRecord._id).populate({
      path: "job",
      populate: { path: "user", select: "firstName lastName profilePhoto" },
    });

    res.status(200).json({ success: true, saved: true, savedJob });
  } catch (error) {
    next(error);
  }
};

exports.removeSavedJob = async (req, res, next) => {
  if (!requireUser(req, next)) return;

  try {
    const deleted = await SavedJob.findOneAndDelete({
      user: req.user._id,
      job: req.params.jobId,
    });

    if (!deleted) return next(new ErrorResponse("Saved job not found", 404));

    res.status(200).json({ success: true, saved: false });
  } catch (error) {
    next(error);
  }
};
