const Job = require("../models/jobModel");
const Notification = require("../models/notificationModel");
const SavedJob = require("../models/savedJobModel");
const UserHistory = require("../models/jobHistory");

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const REMINDER_DAYS = new Set([0, 1, 3]);

const getUtcDay = (date) =>
  Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

const createApplicationDeadlineReminders = async () => {
  const today = new Date();
  const todayUtc = getUtcDay(today);
  const jobs = await Job.find({
    isDeleted: false,
    applicationDeadline: { $exists: true, $ne: null },
  })
    .select("_id title companyName applicationDeadline")
    .lean();

  const dueJobs = jobs
    .map((job) => {
      const deadline = new Date(job.applicationDeadline);
      const daysBeforeDeadline = Math.round(
        (getUtcDay(deadline) - todayUtc) / DAY_IN_MILLISECONDS,
      );
      return { ...job, deadline, daysBeforeDeadline };
    })
    .filter(
      (job) =>
        REMINDER_DAYS.has(job.daysBeforeDeadline) &&
        job.deadline.getTime() >= todayUtc,
    );

  if (dueJobs.length === 0) return;

  const jobIds = dueJobs.map((job) => job._id);
  const [applications, savedJobs] = await Promise.all([
    UserHistory.find({ jobId: { $in: jobIds } }).select("jobId user").lean(),
    SavedJob.find({ job: { $in: jobIds } }).select("job user").lean(),
  ]);
  const recipientsByJob = new Map();

  for (const application of applications) {
    const jobId = String(application.jobId);
    if (!recipientsByJob.has(jobId)) recipientsByJob.set(jobId, new Set());
    if (application.user) {
      recipientsByJob.get(jobId).add(String(application.user));
    }
  }
  for (const savedJob of savedJobs) {
    const jobId = String(savedJob.job);
    if (!recipientsByJob.has(jobId)) recipientsByJob.set(jobId, new Set());
    if (savedJob.user) {
      recipientsByJob.get(jobId).add(String(savedJob.user));
    }
  }

  for (const job of dueJobs) {
    const userIds = recipientsByJob.get(String(job._id));
    if (!userIds) continue;

    const deadlineDate = new Date(getUtcDay(job.deadline));
    const interval =
      job.daysBeforeDeadline === 0
        ? "today"
        : `in ${job.daysBeforeDeadline} day${job.daysBeforeDeadline === 1 ? "" : "s"}`;

    for (const userId of userIds) {
      try {
        await Notification.updateOne(
          {
            userId,
            jobId: job._id,
            notificationType: "application_deadline",
            deadlineDate,
            deadlineDaysBefore: job.daysBeforeDeadline,
          },
          {
            $setOnInsert: {
              userId,
              jobId: job._id,
              deadlineDate,
              deadlineDaysBefore: job.daysBeforeDeadline,
              notificationType: "application_deadline",
              companyName: job.companyName,
              jobTitle: job.title,
              status: `deadline_${job.daysBeforeDeadline}_days`,
              message: `The application deadline for ${job.title} at ${job.companyName} is ${interval} (${deadlineDate.toISOString().slice(0, 10)}).`,
            },
          },
          { upsert: true },
        );
      } catch (error) {
        if (error.code !== 11000) throw error;
      }
    }
  }
};

let reminderInterval;

const startApplicationDeadlineReminderService = () => {
  if (reminderInterval) return;

  const runReminders = () => {
    createApplicationDeadlineReminders().catch((error) => {
      console.error("Unable to create application deadline reminders:", error);
    });
  };

  runReminders();
  reminderInterval = setInterval(runReminders, 60 * 60 * 1000);
};

module.exports = { startApplicationDeadlineReminderService };
