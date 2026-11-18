const mongoose = require("mongoose");

const userPlatformFeedbackSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
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

userPlatformFeedbackSchema.index({ user: 1, submittedAt: -1 });

module.exports = mongoose.model("UserPlatformFeedback", userPlatformFeedbackSchema);