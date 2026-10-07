const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;
const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: [true, "Title is require"],
      maxlength: 32,
    },
    description: {
      type: String,
      trim: true,
      required: [true, "Description is require"],
    },
    salary: {
      type: String,
      trim: true,
      required: [true, "Salary is require"],
    },
    companyName: {
      type: String,
      required: [true, "Companyname is require"],
    },
    location: {
      type: String,
    },
    applicationDeadline: {
      type: Date,
      required: [true, "Application Deadline is required"],
    },
    AdditionalInformation: {
      type: String,
      required: [true, "AdditionalInformation is require"],
    },
    available: {
      type: Boolean,
      default: true,
    },
    jobType: {
      type: ObjectId,
      ref: "JobType",
      required: true,
    },
    user: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  },
);

jobSchema.virtual("userAppliedForJob", {
  ref: "UserHistory",
  localField: "_id",
  foreignField: "jobId",
});

const Job = new mongoose.model("Job", jobSchema);
module.exports = Job;
