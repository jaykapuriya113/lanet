const mongoose = require("mongoose");

const platformFeedbackSchema = new mongoose.Schema(
  {
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    feedback: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  { timestamps: false },
);

module.exports = mongoose.model("PlatformFeedback", platformFeedbackSchema);
