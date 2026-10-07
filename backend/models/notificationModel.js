const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    applicationId: {
      type: ObjectId,
      ref: "UserHistory",
    },
    jobId: {
      type: ObjectId,
      ref: "Job",
    },
    deadlineDate: {
      type: Date,
    },
    deadlineDaysBefore: {
      type: Number,
      enum: [0, 1, 3],
    },
    responseAt: {
      type: Date,
    },
    notificationType: {
      type: String,
      enum: [
        "application_status",
        "interview",
        "application_deadline",
        "interview_response",
        "new_job",
      ],
      default: "application_status",
    },
    candidateName: {
      type: String,
      trim: true,
    },
    companyName: {
      type: String,
      trim: true,
      required: true,
    },
    jobTitle: {
      type: String,
      trim: true,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    interviewDate: {
      type: String,
      trim: true,
    },
    interviewTime: {
      type: String,
      trim: true,
    },
    interviewMode: {
      type: String,
      enum: ["online"],
    },
    meetingLink: {
      type: String,
      trim: true,
    },
    message: {
      type: String,
      trim: true,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index(
  { userId: 1, applicationId: 1, notificationType: 1 },
  {
    unique: true,
    partialFilterExpression: { notificationType: "interview" },
  },
);
notificationSchema.index(
  {
    userId: 1,
    jobId: 1,
    deadlineDate: 1,
    deadlineDaysBefore: 1,
  },
  {
    unique: true,
    partialFilterExpression: { notificationType: "application_deadline" },
  },
);
notificationSchema.index(
  { userId: 1, applicationId: 1, responseAt: 1 },
  {
    unique: true,
    partialFilterExpression: { notificationType: "interview_response" },
  },
);
notificationSchema.index(
  { userId: 1, jobId: 1 },
  {
    unique: true,
    partialFilterExpression: { notificationType: "new_job" },
  },
);

const Notification = mongoose.model("Notification", notificationSchema);
module.exports = Notification;
