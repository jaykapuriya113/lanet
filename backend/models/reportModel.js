const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const reportSchema = new mongoose.Schema(
  {
    // What kind of content is being reported
    contentType: {
      type: String,
      enum: ["job"],
      required: [true, "contentType is required"],
    },
    // Reference to the reported job
    job: {
      type: ObjectId,
      ref: "Job",
      required: [true, "job reference is required"],
    },
    // Snapshot of the job title at the time of report (survives deletion)
    jobTitle: {
      type: String,
      trim: true,
    },
    reason: {
      type: String,
      enum: [
        "spam",
        "fake_job",
        "inappropriate_content",
        "misleading_info",
        "scam",
        "other",
      ],
      required: [true, "reason is required"],
    },
    // Optional free-text detail from the reporter
    details: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    // User who submitted the report
    reporter: {
      type: ObjectId,
      ref: "User",
      required: [true, "reporter is required"],
    },
    // Admin review status
    status: {
      type: String,
      enum: ["pending", "reviewed", "dismissed", "resolved"],
      default: "pending",
    },
    // Admin note added when reviewing/resolving
    adminNote: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    reviewedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

// One report per user per job (prevents spam)
reportSchema.index({ job: 1, reporter: 1 }, { unique: true });

const Report = mongoose.model("Report", reportSchema);
module.exports = Report;
