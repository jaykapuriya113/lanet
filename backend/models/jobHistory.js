const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const statusHistoryLabels = {
  pending: "Applied",
  applied: "Applied",
  under_review: "Under Review",
  shortlisted: "Shortlisted",
  interview: "Interview",
  selected: "Selected",
  accepted: "Selected",
  rejected: "Rejected",
};

const jobsHistorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      maxlength: 32,
    },
    description: {
      type: String,
      trim: true,
    },
    salary: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
    },
    resume: {
      type: String,
      trim: true,
    },
    interviewDate: {
      type: String,
    },
    interview: {
      type: new mongoose.Schema(
        {
          date: { type: String, required: true },
          time: { type: String, required: true },
          mode: { type: String, enum: ["online"], required: true },
          meetingLink: { type: String, required: true, trim: true },
          recruiter: { type: ObjectId, ref: "User", required: true },
          response: {
            type: String,
            enum: ["pending", "accepted", "declined"],
            default: "pending",
          },
          respondedAt: { type: Date },
          status: {
            type: String,
            enum: ["completed"],
          },
        },
        { _id: false },
      ),
      default: undefined,
    },
    feedback: {
      type: new mongoose.Schema(
        {
          rating: { type: Number, min: 1, max: 5 },
          comment: { type: String, trim: true, maxlength: 16000 },
          overallExperience: { type: String, trim: true, maxlength: 5000 },
          likedMost: { type: String, trim: true, maxlength: 5000 },
          suggestedImprovements: { type: String, trim: true, maxlength: 5000 },
          user: { type: ObjectId, ref: "User", required: true },
          job: { type: ObjectId, ref: "Job", required: true },
          submittedAt: { type: Date, required: true },
          adminStatus: { type: String, enum: ["reviewed", "resolved"] },
          adminNote: { type: String, trim: true, maxlength: 500, default: "" },
          reviewedAt: { type: Date },
        },
        { _id: false },
      ),
      default: undefined,
    },
    applicationStatus: {
      type: String,
      enum: [
        "pending",
        "under_review",
        "shortlisted",
        "interview",
        "selected",
        "accepted",
        "rejected",
      ],
      default: "pending",
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    matchedSkills: {
      type: [String],
      default: [],
    },
    missingSkills: {
      type: [String],
      default: [],
    },
    matchExplanation: {
      type: String,
      trim: true,
      default: "",
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: [
            "Applied",
            "Under Review",
            "Shortlisted",
            "Interview",
            "Selected",
            "Rejected",
          ],
          required: true,
        },
        rawStatus: {
          type: String,
          enum: [
            "pending",
            "under_review",
            "shortlisted",
            "interview",
            "selected",
            "accepted",
            "rejected",
          ],
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    role: {
      type: Number,
      default: 0,
    },
    jobId: {
      type: ObjectId,
      ref: "Job",
    },
    user: {
      type: ObjectId,
      ref: "User",
    },
    coverLetter: {
      type: String,
      required: [true, "coverLetter is require"],
      trim: true,
    },
    assessment: {
      type: String,
      required: [true, "assessment is require"],
      trim: true,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  },
);

jobsHistorySchema.methods.pushStatusHistory = function (statusKey, timestamp = new Date()) {
  const normalizedKey = (statusKey || "pending").trim();
  const statusLabel = statusHistoryLabels[normalizedKey] || "Applied";
  const history = Array.isArray(this.statusHistory) ? this.statusHistory : [];
  const lastEntry = history[history.length - 1];

  if (lastEntry && (lastEntry.rawStatus === normalizedKey || lastEntry.status === statusLabel)) {
    return false;
  }

  this.statusHistory = [
    ...history,
    {
      status: statusLabel,
      rawStatus: normalizedKey,
      timestamp,
    },
  ];

  return true;
};

jobsHistorySchema.index({ user: 1, jobId: 1 }, { unique: true });

const UserHistory = new mongoose.model("UserHistory", jobsHistorySchema);
module.exports = UserHistory;
